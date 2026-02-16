from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

from user_manager.models import User
from notification_manager.models import (
    UserNotification,
    NotificationTemplate,
    Notification,
)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=30, retry_kwargs={"max_retries": 3})
def send_question_update_email(self, student_ids, question_ids):

    from test_manager.models import QuestionAnswer
    from test_manager.models import TestSubmission

    if not student_ids:
        return "No students to notify"

    template = NotificationTemplate.objects.get(
        name="QUESTION_ANSWER_UPDATED"
    )

    students = User.objects.filter(id__in=student_ids)

    for student in students:

        # Get ONE related test for display
        qa = QuestionAnswer.objects.filter(
            question_id__in=question_ids,
            result__test_submission__student=student
        ).select_related(
            "result__test_submission__test"
        ).first()

        if qa:
            test_name = qa.result.test_submission.test.name
            question_srno = qa.question.srno
        else:
            test_name = "Your Test"
            question_srno = question_ids[0]

        subject = template.subject \
            .replace("%USER_NAME%", student.name) \
            .replace("%TEST_NAME%", test_name) \
            .replace("%REFERENCE_ID%", str(question_srno))

        description = template.description \
            .replace("%USER_NAME%", student.name) \
            .replace("%TEST_NAME%", test_name) \
            .replace("%REFERENCE_ID%", str(question_srno))

        # 🔔 In-app notification
        UserNotification.objects.create(
            user=student,
            subject=subject,
            description=description,
            category=Notification.TEST,
            reference_id=question_srno,
        )

        # 📧 Email
        send_mail(
            subject=subject,
            message=description,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[student.email],
            fail_silently=False,
        )

    return "Emails sent successfully"
