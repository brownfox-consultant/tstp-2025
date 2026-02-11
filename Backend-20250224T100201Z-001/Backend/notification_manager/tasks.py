from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

from user_manager.models import User
from notification_manager.models import (
    UserNotification,
    NotificationTemplate,
    Notification,
)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 3},
)
def send_question_update_email(self, student_ids, question_ids):
    """
    Send email + create in-app notification
    when admin corrects a question answer.
    """

    if not student_ids:
        return "No students to notify"

    try:
        template = NotificationTemplate.objects.get(
            name="QUESTION_ANSWER_UPDATED"
        )
    except NotificationTemplate.DoesNotExist:
        return "Template not found"

    students = User.objects.filter(id__in=student_ids)

    notified_count = 0

    for student in students:

        subject = template.subject.replace(
            NotificationTemplate.USER_NAME,
            student.name
        )

        description = template.description.replace(
            NotificationTemplate.USER_NAME,
            student.name
        )

        # ------------------------------------
        # 1️⃣ Create in-app notification
        # ------------------------------------
        UserNotification.objects.create(
            user=student,
            subject=subject,
            description=description,
            category=Notification.TEST,
            reference_id=question_ids[0],  # first updated question
        )

        # ------------------------------------
        # 2️⃣ Send Email
        # ------------------------------------
        send_mail(
            subject=subject,
            message=description,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[student.email],
            fail_silently=False,
        )

        notified_count += 1

    return f"Successfully notified {notified_count} students"
