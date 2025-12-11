from django.core.management.base import BaseCommand

from course_manager.models import CourseSubjects, Question
from test_manager.models import Result, SectionStats, QuestionAnswer


class Command(BaseCommand):
    help = 'Migrate detailed_view JSON data to QuestionAnswer and SectionStats tables.'

    def handle(self, *args, **kwargs):
        migrated_results = 0

        for result in Result.objects.all():
            detailed_view = result.detailed_view
            if not detailed_view:
                continue

            answers = detailed_view.get('answers', {})
            for course_subject_id, sections in answers.items():
                try:
                    # Retrieve the course subject object
                    course_subject = CourseSubjects.objects.get(id=int(course_subject_id))
                except CourseSubjects.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f"CourseSubject with ID {course_subject_id} does not exist. Skipping."))
                    continue

                for section_id, section_data in sections.items():
                    # Create SectionStats entry
                    SectionStats.objects.create(
                        result=result,
                        course_subject=course_subject,
                        section_id=int(section_id),
                        time_taken=section_data.get('time_taken', 0),
                        total_questions=section_data.get('total_questions', 0),
                    )

                    # Create QuestionAnswer entries
                    questions_answered = section_data.get('questions_answered', {})
                    for question_id, question_data in questions_answered.items():
                        try:
                            # Retrieve the question object
                            question = Question.objects.get(id=int(question_id))
                        except Question.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(f"Question with ID {question_id} does not exist. Skipping."))
                            continue

                        QuestionAnswer.objects.create(
                            result=result,
                            course_subject=course_subject,
                            section_id=int(section_id),
                            question=question,
                            is_correct=question_data.get('is_correct', False),
                            is_skipped=question_data.get('is_skipped', False),
                            time_taken=question_data.get('time_taken', 0),
                            selected_options=question_data.get('answer_data', []),
                            times_visited=question_data.get('times_visited', 0),
                            first_time_taken=question_data.get('first_time_taken', 0),
                            is_marked_for_review=question_data.get('is_marked_for_review', False),
                        )

            migrated_results += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {migrated_results} Result records.'))
