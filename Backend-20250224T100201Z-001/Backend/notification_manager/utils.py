from celery import shared_task
from django.core.mail import EmailMessage
from django.utils import timezone

from notification_manager.models import Notification, NotificationChannel, NotificationTemplate, UserNotification
from user_manager.models import TempUser, User, StudentMetadata, Role


@shared_task
def send_notification(notification_name, params, user_id):
    print("hellooo")
    # Get the notification object from the name
    notification = Notification.objects.get(name=notification_name)

    # Fetch the associated notification channels
    channels = NotificationChannel.objects.filter(notification=notification)
    reference_id = None
    for channel in channels:
        # Fetch the associated template
        template = NotificationTemplate.objects.get(name=channel.template_name)
        # Replace wildcards in the subject and description with the given params
        formatted_subject = template.subject
        formatted_description = template.description

        for key, value in params.items():
            formatted_subject = formatted_subject.replace(key, str(value))
            formatted_description = formatted_description.replace(key, str(value))

            if key == NotificationTemplate.REFERENCE_ID:
                reference_id = value

        # Check the channel type and call the respective function
        if channel.channel_name == NotificationChannel.EMAIL:
            send_email(user_ids=[user_id], subject=formatted_subject, description=formatted_description,
                       category=notification.category)
        elif channel.channel_name == NotificationChannel.NOTIFICATION:
            user_ids = get_users_for_notification_category(category=notification.category, user_id=user_id)

            create_user_notification(user_ids=user_ids, subject=formatted_subject, description=formatted_description,
                                     category=notification.category,
                                     reference_id=reference_id)


@shared_task
def send_email(user_ids, subject, description, category, cc_recipients=None):
    for user_id in user_ids:
        from_email = 'settings.EMAIL_HOST_USER'
        recipient_list = None
        try:
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
                from_email=from_email,
                to=recipient_list,
                bcc=cc_recipients
            )
            email.send()

        except Exception as e:
            # log instead of crashing the worker
            print(f"[send_email] Failed to send email to user_id={user_id}: {e}")


@shared_task
def create_user_notification(user_ids, subject, description, category, reference_id):
    for user_id in user_ids:
        UserNotification.objects.create(user_id=user_id, subject=subject, description=description, category=category,
                                        reference_id=reference_id)


@shared_task
def mark_notification_as_read(user_id, category, reference_id):
    user_ids = get_users_for_notification_category(category=category, user_id=user_id)
    for user_id in user_ids:
        user_notification = UserNotification.objects.get(user_id=user_id, reference_id=reference_id, category=category)
        user_notification.status = UserNotification.READ
        user_notification.updated_at = timezone.now()
        user_notification.save()


def get_users_for_notification_category(category, user_id):
    user_ids = []
    # if user_id is not None:

    if category == Notification.TEST:
        user_ids.append(user_id)

        father, mother = get_parents_for_student(user_id=user_id)
        if father is not None:
            user_ids.append(father.id)
        if mother is not None:
            user_ids.append(mother.id)

        faculty = get_faculty_for_student(user_id=user_id)
        if faculty is not None:
            user_ids.append(faculty.id)

        mentor = get_mentor_for_student(user_id=user_id)
        if mentor is not None:
            user_ids.append(mentor.id)

    elif category == Notification.CONCERN or category == Notification.MEETING or category == Notification.ISSUE:
        admins = get_all_users_by_role(Role.get_role_using_name('admin').id)
        user_ids.extend(admins)

    elif category == Notification.SUGGESTION:
        admins = get_all_users_by_role(Role.get_role_using_name('admin').id)
        user_ids.extend(admins)

        content_developers = get_all_users_by_role(Role.get_role_using_name('content_developer').id)
        user_ids.extend(content_developers)

    elif category == Notification.DOUBT:
        user = User.get_user_by_id(user_id)
        if user.role.name == 'student':
            admins = get_all_users_by_role(Role.get_role_using_name('admin').id)
            user_ids.extend(admins)
            mentor = get_mentor_for_student(user_id=user_id)
            if mentor is not None:
                user_ids.append(mentor.id)
        else:
            user_ids.append(user_id)

    return user_ids


def get_faculty_for_student(user_id):
    student_metadata = StudentMetadata.get_student_metadata_using_id(student_id=user_id)
    return student_metadata.faculty


def get_mentor_for_student(user_id):
    student_metadata = StudentMetadata.get_student_metadata_using_id(student_id=user_id)
    return student_metadata.mentor


def get_parents_for_student(user_id):
    student_metadata = StudentMetadata.get_student_metadata_using_id(student_id=user_id)
    return student_metadata.father, student_metadata.mother


def get_all_users_by_role(role_id):
    users = User.filter_users_by_role(role_id=role_id)
    return [user.id for user in users]


ROLE_CATEGORY_MAPPING = {
    'admin': ['CONCERN', 'MEETING', 'ISSUE', 'SUGGESTION', 'DOUBT'],
    'content_developer': ['SUGGESTION'],
    'faculty': ['DOUBT', 'TEST'],
    'mentor': ['DOUBT', 'TEST'],
    'student': ['FEEDBACK', 'TEST'],
    'parent': ['FEEDBACK', 'TEST'],
}
