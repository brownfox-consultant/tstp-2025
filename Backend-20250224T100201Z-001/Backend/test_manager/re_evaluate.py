from django.utils import timezone

from test_manager.models import (
    QuestionAnswer,
    PracticeQuestionAnswer,
    TestSubmission,
    PracticeTestResult,
)
from test_manager.utils import evaluate_question_answer


def check_gridin_answer(question, selected_answer):
    if not selected_answer:
        return False

    correct_answers = question.options or []

    selected_answer = str(selected_answer).strip()

    correct_answers = [str(ans).strip() for ans in correct_answers]

    return selected_answer in correct_answers

def re_evaluate_question_answers_sync(question_ids):
    """
    Synchronous re-evaluation (NO CELERY, NO recalculation method)
    """

    question_ids = list(set(question_ids))

    # =====================================================
    # FULL LENGTH TESTS
    # =====================================================
    answers = QuestionAnswer.objects.select_related(
        "question",
        "result",
        "result__test_submission",
    ).filter(question_id__in=question_ids)

    for ans in answers:
        question = ans.question
        result_obj = ans.result

        if question.question_type == "GRIDIN":
            now_correct = check_gridin_answer(
                question,
                ans.selected_options
            )
        else:
            now_correct = evaluate_question_answer(
                question=question,
                selected_options=ans.selected_options
            )

        if ans.is_correct != now_correct:
            # 1️⃣ Update DB answer
            ans.is_correct = now_correct
            ans.save(update_fields=["is_correct"])

            # 2️⃣ Update detailed_view (THIS FIXES UI)
            detailed = result_obj.detailed_view or {}
            answers_map = detailed.get("answers", {})

            cs_key = str(ans.course_subject_id)
            sec_key = str(ans.section_id)
            q_key = str(ans.question_id)

            try:
                answers_map[cs_key][sec_key]["questions_answered"][q_key]["is_correct"] = now_correct
            except KeyError:
                pass

            detailed["answers"] = answers_map
            result_obj.detailed_view = detailed
            result_obj.save(update_fields=["detailed_view"])

    # =====================================================
    # PRACTICE TESTS
    # =====================================================
    practice_answers = PracticeQuestionAnswer.objects.select_related(
        "question",
        "practice_test_result",
    ).filter(question_id__in=question_ids)

    for ans in practice_answers:
        question = ans.question
        result_obj = ans.practice_test_result

        now_correct = evaluate_question_answer(
            question=question,
            selected_options=ans.selected_options
        )

        if ans.is_correct != now_correct:
            ans.is_correct = now_correct
            ans.save(update_fields=["is_correct"])

            detailed = result_obj.detailed_view or {}
            answers_map = detailed.get("answers", {})

            q_key = str(ans.question_id)
            if q_key in answers_map:
                answers_map[q_key]["is_correct"] = now_correct

            detailed["answers"] = answers_map
            result_obj.detailed_view = detailed
            result_obj.save(update_fields=["detailed_view"])
