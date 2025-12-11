from django.core.management.base import BaseCommand

from course_manager.models import Question


class Command(BaseCommand):
    help = "Create default courses and subjects"

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        objects = Question.objects.all()

        # Iterate over each object
        for obj in objects:

            obj.question_subtype = obj.question_type
            if obj.question_type in [Question.MCQ_SINGLE_CHOICE_QUESTION, Question.MCQ_MULTI_CHOICE_QUESTION,
                                     Question.MCQ_READING_COMPREHENSION]:
                obj.question_type = Question.MCQ
            else:
                obj.question_type = Question.GRIDIN
            obj.save()
