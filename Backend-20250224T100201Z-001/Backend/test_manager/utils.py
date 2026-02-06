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


def evaluate_question_answer(question, selected_options):
    """
    Returns True / False for MCQ & GRIDIN
    """

    # -----------------------------
    # MCQ / READING COMPREHENSION
    # -----------------------------
    if question.question_type == "MCQ":
        correct_indices = [
            idx for idx, opt in enumerate(question.options)
            if opt.get("is_correct") is True
        ]

        return sorted(selected_options or []) == sorted(correct_indices)

    # -----------------------------
    # GRIDIN
    # -----------------------------
    if question.question_type == "GRIDIN":
        
        from course_manager.models import Question 
        return Question.compare_answers(
            answer=selected_options[0] if selected_options else None,
            options=question.options
        )

    return False
