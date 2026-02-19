from celery import shared_task
from django.core.mail import EmailMessage
from django.utils import timezone
from django.conf import settings

from notification_manager.models import (
    Notification,
    NotificationChannel,
    NotificationTemplate,
    UserNotification
)
from user_manager.models import TempUser, User, StudentMetadata, Role


# ============================================================
# MAIN NOTIFICATION DISPATCHER
# ============================================================

@shared_task
def send_notification(notification_name, params, user_id):

    notification = Notification.objects.get(name=notification_name)
    channels = NotificationChannel.objects.filter(notification=notification)

    reference_id = None

    for channel in channels:

        template = NotificationTemplate.objects.get(name=channel.template_name)

        formatted_subject = template.subject
        formatted_description = template.description

        # Replace wildcards
        for key, value in params.items():
            formatted_subject = formatted_subject.replace(key, str(value))
            formatted_description = formatted_description.replace(key, str(value))

            if key == NotificationTemplate.REFERENCE_ID:
                reference_id = value

        # EMAIL CHANNEL
        if channel.channel_name == NotificationChannel.EMAIL:
            send_email.delay(
                user_ids=[user_id],
                subject=formatted_subject,
                description=formatted_description,
                category=notification.category
            )

        # IN-APP NOTIFICATION CHANNEL
        elif channel.channel_name == NotificationChannel.NOTIFICATION:

            user_ids = get_users_for_notification_category(
                category=notification.category,
                user_id=user_id
            )

            create_user_notification.delay(
                user_ids=user_ids,
                subject=formatted_subject,
                description=formatted_description,
                category=notification.category,
                reference_id=reference_id
            )


# ============================================================
# SEND EMAIL
# ============================================================

@shared_task
def send_email(user_ids, subject, description, category, cc_recipients=None):

    for user_id in user_ids:

        try:
            recipient_list = None

            if category == Notification.REGISTRATION:
                temp_user = TempUser.get_temp_user_using_id(user_id)
                if not temp_user:
                    continue
                recipient_list = [temp_user.email]
            else:
                user = User.get_user_by_id(user_id)
                if not user:
                    continue
                recipient_list = [user.email]

            email = EmailMessage(
                subject=subject,
                body=description,
                from_email=settings.EMAIL_HOST_USER,  # ✅ FIXED
                to=recipient_list,
                bcc=cc_recipients
            )

            email.send(fail_silently=False)

        except Exception as e:
            print(f"[send_email] Failed user_id={user_id} → {e}")


# ============================================================
# CREATE IN-APP NOTIFICATION
# ============================================================

@shared_task
def create_user_notification(user_ids, subject, description, category, reference_id):

    for user_id in set(user_ids):  # remove duplicates
        try:
            UserNotification.objects.create(
                user_id=user_id,
                subject=subject,
                description=description,
                category=category,
                reference_id=reference_id
            )
        except Exception as e:
            print(f"[create_user_notification] Failed user_id={user_id} → {e}")


# ============================================================
# MARK AS READ
# ============================================================

@shared_task
def mark_notification_as_read(user_id, category, reference_id):

    user_ids = get_users_for_notification_category(
        category=category,
        user_id=user_id
    )

    for uid in set(user_ids):
        try:
            user_notification = UserNotification.objects.get(
                user_id=uid,
                reference_id=reference_id,
                category=category
            )
            user_notification.status = UserNotification.READ
            user_notification.updated_at = timezone.now()
            user_notification.save()
        except UserNotification.DoesNotExist:
            continue
        except Exception as e:
            print(f"[mark_notification_as_read] Error → {e}")


# ============================================================
# USER RESOLUTION LOGIC
# ============================================================

def get_users_for_notification_category(category, user_id):

    user_ids = []

    if category == Notification.TEST:

        user_ids.append(user_id)

        father, mother = get_parents_for_student(user_id)

        if father:
            user_ids.append(father.id)

        if mother:
            user_ids.append(mother.id)

        # ✅ FIXED MANY-TO-MANY FACULTIES
        faculty_ids = get_faculty_for_student(user_id)
        user_ids.extend(faculty_ids)

        mentor = get_mentor_for_student(user_id)
        if mentor:
            user_ids.append(mentor.id)

    elif category in [Notification.CONCERN, Notification.MEETING, Notification.ISSUE]:
        admins = get_all_users_by_role(Role.get_role_using_name('admin').id)
        user_ids.extend(admins)

    elif category == Notification.SUGGESTION:
        admins = get_all_users_by_role(Role.get_role_using_name('admin').id)
        user_ids.extend(admins)

        content_devs = get_all_users_by_role(
            Role.get_role_using_name('content_developer').id
        )
        user_ids.extend(content_devs)

    elif category == Notification.DOUBT:

        user = User.get_user_by_id(user_id)

        if user and user.role.name == 'student':

            admins = get_all_users_by_role(Role.get_role_using_name('admin').id)
            user_ids.extend(admins)

            mentor = get_mentor_for_student(user_id)
            if mentor:
                user_ids.append(mentor.id)

        else:
            user_ids.append(user_id)

    return list(set(user_ids))  # remove duplicates


# ============================================================
# STUDENT RELATION HELPERS (FIXED)
# ============================================================

def get_faculty_for_student(user_id):
    try:
        student_metadata = StudentMetadata.get_student_metadata_using_id(
            student_id=user_id
        )

        if not student_metadata:
            return []

        # ✅ faculties is ManyToMany
        return list(
            student_metadata.faculties.values_list("id", flat=True)
        )

    except Exception as e:
        print(f"[get_faculty_for_student] Error → {e}")
        return []


def get_mentor_for_student(user_id):
    try:
        student_metadata = StudentMetadata.get_student_metadata_using_id(
            student_id=user_id
        )
        return student_metadata.mentor if student_metadata else None
    except Exception:
        return None


def get_parents_for_student(user_id):
    try:
        student_metadata = StudentMetadata.get_student_metadata_using_id(
            student_id=user_id
        )
        if not student_metadata:
            return None, None

        return student_metadata.father, student_metadata.mother
    except Exception:
        return None, None


def get_all_users_by_role(role_id):
    users = User.filter_users_by_role(role_id=role_id)
    return [user.id for user in users]


# ============================================================
# ROLE CATEGORY MAP
# ============================================================

ROLE_CATEGORY_MAPPING = {
    'admin': ['CONCERN', 'MEETING', 'ISSUE', 'SUGGESTION', 'DOUBT'],
    'content_developer': ['SUGGESTION'],
    'faculty': ['DOUBT', 'TEST'],
    'mentor': ['DOUBT', 'TEST'],
    'student': ['FEEDBACK', 'TEST'],
    'parent': ['FEEDBACK', 'TEST'],
}
