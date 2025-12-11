from django.core.management.base import BaseCommand

from test_manager.models import PracticeTestResult, PracticeQuestionAnswer, Question


class Command(BaseCommand):
    help = 'Migrate data from detailed_view JSONField to PracticeQuestionAnswer model'

    def handle(self, *args, **kwargs):
        for practice_test_result in PracticeTestResult.objects.all():
            detailed_view = practice_test_result.detailed_view.get("answers", {})

            for question_id, details in detailed_view.items():
                try:
                    question = Question.objects.get(id=question_id)
                    PracticeQuestionAnswer.objects.create(
                        practice_test_result=practice_test_result,
                        question=question,
                        is_correct=details.get('is_correct', False),
                        is_skipped=details.get('is_skipped', False),
                        time_taken=details.get('time_taken', 0),
                        selected_options=details.get('answer_data', []),
                        times_visited=details.get('times_visited', 0),
                        first_time_taken=details.get('first_time_taken', 0),
                        is_marked_for_review=details.get('is_marked_for_review', False)
                    )
                except Question.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'Question with ID {question_id} does not exist. Skipping...'))

        self.stdout.write(self.style.SUCCESS('Data migration completed successfully.'))
