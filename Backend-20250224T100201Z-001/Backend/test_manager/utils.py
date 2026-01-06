from course_manager.models import CourseEnrollment

def is_paid_user(student):
    return CourseEnrollment.objects.filter(
        student=student
    ).exclude(subscription_type=CourseEnrollment.FREE).exists()



def calculate_total_questions_required(course_subject):
    total_questions = 0
    for section in course_subject.metadata.get("sections", []):
        total_questions += section.get("no_of_questions", 0)
    return total_questions

