import logging
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.utils.timezone import now, timedelta
from sTest.aws_client import AwsStorageClient
from sTest.permissions import IsAdminOrContentDeveloperOrFaculty, IsAdminOrContentDeveloper, IsAdmin, \
    IsAdminOrContentDeveloperOrFacultyOrStudent
from sTest.utils import get_error_response_for_serializer, get_error_response, CustomPageNumberPagination
from user_manager.serializers import StudentSerializer
from system_manager.models import Suggestion
from .filters import QuestionFilter, MaterialFilter
from .models import Question, QuestionLog ,Course, Subject, CourseSubjects, Material, CourseEnrollment, Topic,DeletedQuestion
from .serializers import CreateQuestionSerializer, CourseWithSubjectsSerializer, QuestionListSerializer, \
    CourseSerializer, CreateCourseSerializer, MaterialSerializer, SubjectSerializer, \
    MaterialListSerializer, MaterialDetailsSerializer, TopicSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db.models import Max 
import csv
from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from django.db.models import Count
from openpyxl import Workbook
from django.http import HttpResponse
from rest_framework.decorators import action
import datetime
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
import datetime
from django_filters.rest_framework import DjangoFilterBackend
from .filters import CourseFilter
from .utils import build_question_availability_map, get_question_signature
from .utils import has_answer_changed, filter_questions_by_signature
from test_manager.re_evaluate import re_evaluate_question_answers_sync
from test_manager.re_evaluate import re_evaluate_question_answers_sync
from test_manager.models import QuestionAnswer, PracticeQuestionAnswer
from notification_manager.tasks import send_question_update_email
from course_manager.utils import has_options_changed
from system_manager.models import Doubt
from io import BytesIO

from django.http import HttpResponse
from openpyxl import Workbook
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph
from rest_framework.decorators import action
from rest_framework.response import Response

from course_manager.models import Question
from django.utils.html import strip_tags
from xml.sax.saxutils import escape
from io import BytesIO
from django.http import HttpResponse
from django.utils.html import strip_tags
from xml.sax.saxutils import escape
from openpyxl import Workbook

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from rest_framework.decorators import action
from rest_framework.response import Response
import json

from django.core import serializers
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import Question, DeletedQuestion

import datetime

from django.db import transaction
from django.db.models import Q, Count
from django.utils import timezone
from django.core import serializers as django_serializers

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import Http404










class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.get_all()
    serializer_class = CourseSerializer
    logger = logging.getLogger('Courses')
    filter_backends = [DjangoFilterBackend]
    filterset_class = CourseFilter

    @action(
    detail=True,
    methods=['get'],
    permission_classes=[AllowAny],
    url_path='subjects'
)
    def get_subjects_by_course(self, request, pk=None):
        """
        GET /api/course/{course_id}/subjects/
        """
        try:
            course = Course.get_course_by_id(course_id=pk)

            course_subjects = CourseSubjects.objects.filter(course=course)

            subjects = [cs.subject for cs in course_subjects]

            serializer = SubjectSerializer(
                subjects,
                many=True,
                context={"course_id": course.id}  # 🔑 IMPORTANT
            )

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )


    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[AllowAny],
    url_path='student-courses'
)
    def get_student_courses(self, request):
        """
        GET /api/course/student-courses/?user_id=123
        """

        user_id = request.query_params.get('user_id')

        if not user_id:
            return Response(
                {"error": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get course IDs assigned to the student
        course_ids = CourseEnrollment.objects.filter(
            student_id=user_id
        ).values_list('course_id', flat=True)

        # Fetch active courses only
        courses = Course.objects.filter(
            id__in=course_ids,
            is_active=True
        ).order_by('id')

        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='constants')
    def get_question_constants(self, request):
        # Get choices from Question model
        difficulty_list = [
            choice[0] for choice in Question.DIFFICULTY_CHOICES
            
        ]
        question_type_list = [choice[0] for choice in Question.QUESTION_TYPE]
        test_type_list = [choice[0] for choice in Question.TEST_TYPE_CHOICES]
        question_subtype_list = [
            {"value": choice[0], "label": choice[1]}
            for choice in Question.QUESTION_SUBTYPE
        ]


        # If you also want topics:
        topics = (
            Topic.objects
            .select_related('course_subject__course', 'course_subject__subject')
            .prefetch_related('subtopics__topic__course_subject__course',
                            'subtopics__topic__course_subject__subject')
        )


        serialized_topics = TopicSerializer(topics, many=True).data

        return Response({
            "topics": serialized_topics,
            "difficultyList": difficulty_list,
            "questionTypeList": question_type_list,
            "testTypeList": test_type_list,
            "questionSubtypeList": question_subtype_list,  # ✅ added
        })

        
    @permission_classes([IsAdmin])
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = CreateCourseSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            # Create or get the Course
            course, _ = Course.objects.get_or_create(name=data['name'])

            for subject_data in data['subjects']:
                # Create or get the Subject
                subject, _ = Subject.objects.get_or_create(name=subject_data['name'])

                # Append an ID to each section
                for index, section in enumerate(subject_data['sections']):
                    section['id'] = index + 1  # ID based on index

                # Prepare metadata for CourseSubjects
                metadata = {'sections': subject_data['sections']}

                # Create CourseSubjects entry
                CourseSubjects.objects.create(
                    course=course,
                    subject=subject,
                    metadata=metadata,
                    correct_answer_marks=subject_data['correct_answer_marks'],
                    incorrect_answer_marks=subject_data['incorrect_answer_marks'],
                    order=subject_data['order']
                )

            return Response({"detail": "Course and subjects created successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @permission_classes([IsAdminOrContentDeveloperOrFaculty])
    def list(self, request, *args, **kwargs):
        courses = Course.get_all()
        serializer = CourseWithSubjectsSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @permission_classes([IsAdmin])
    def retrieve(self, request, pk=None, *args, **kwargs):
        course = Course.get_course_by_id(course_id=pk)
        serializer = CourseWithSubjectsSerializer(course)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @permission_classes([IsAdmin])
    @transaction.atomic
    def update(self, request, pk=None, *args, **kwargs):
        course = Course.get_course_by_id(course_id=pk)
        serializer = CreateCourseSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

        data = serializer.validated_data

        # Update the course name if it has changed
        if course.name != data['name']:
            course.name = data['name']
            course.updated_at = timezone.now()
            course.save()

        existing_subjects = CourseSubjects.objects.filter(course=course)
        for subject_data in data['subjects']:
            self.logger.info(f'Processing subject {subject_data} for course {course.id}')
            subject, _ = Subject.objects.get_or_create(name=subject_data['name'])

            # Append an ID to each section
            for index, section in enumerate(subject_data['sections']):
                section['id'] = index + 1

            # Update metadata for CourseSubjects
            metadata = {'sections': subject_data['sections']}

            course_subject = None
            if 'course_subject_id' in subject_data:
                course_subject = CourseSubjects.objects.get(id=subject_data['course_subject_id'])
            else:
                course_subject = CourseSubjects.objects.filter(course=course.id, subject=subject.id).first()

            # Check if we are updating an existing subject in this course
            if course_subject is not None:
                course_subject.course = course
                course_subject.subject = subject
                course_subject.metadata = metadata
                course_subject.correct_answer_marks = subject_data['correct_answer_marks']
                course_subject.incorrect_answer_marks = subject_data['incorrect_answer_marks']
                course_subject.order = subject_data['order']
                course_subject.save()
            else:
                CourseSubjects.objects.create(
                    course=course,
                    subject=subject,
                    metadata=metadata,
                    correct_answer_marks=subject_data['correct_answer_marks'],
                    incorrect_answer_marks=subject_data['incorrect_answer_marks'],
                    order=subject_data['order']
                )
            existing_subjects = existing_subjects.exclude(Q(subject=subject))

        # Delete any remaining old subjects
        existing_subjects.delete()
        return Response({"detail": "Course and subjects updated successfully"}, status=status.HTTP_200_OK)

    @permission_classes([IsAdmin])
    def destroy(self, request, pk=None, *args, **kwargs):
        instance = Course.get_course_by_id(course_id=pk)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        # instance.is_active = False
        # instance.updated_at = timezone.now()
        # instance.save()
        instance.delete()

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin], url_path='deactivate')
    def deactivate_course(self, request, pk=None):
        course = Course.get_course_by_id(course_id=pk)
        # course.is_active = False
        # course.updated_at = timezone.now()
        # course.save()
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['GET'], permission_classes=[AllowAny], url_path='list')
    def list_courses(self, request):
        courses = Course.get_all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAdminOrContentDeveloperOrFaculty],
    url_path='(?P<course_subject_id>\\d+)/questions'
)
    def list_questions_by_subject(self, request, course_subject_id=None):

        if not course_subject_id:
            return get_error_response('course_subject_id is mandatory')

        # 1️⃣ Resolve base course_subject
        try:
            base_cs = CourseSubjects.objects.select_related(
                'course', 'subject'
            ).get(id=course_subject_id)
        except CourseSubjects.DoesNotExist:
            return get_error_response('Invalid course_subject_id')

        # 2️⃣ QUESTIONS TO DISPLAY (same course + same subject)
        display_course_subject_ids = CourseSubjects.objects.filter(
            course=base_cs.course,
            subject=base_cs.subject
        ).values_list('id', flat=True)

        questions = (
            Question.objects
            .filter(course_subject_id__in=display_course_subject_ids)
            .select_related(
                'course_subject__course',
                'course_subject__subject',
                'topic',
                'sub_topic'
            )
        )

        topics = Topic.objects.filter(
            course_subject_id__in=display_course_subject_ids
        )

        # 3️⃣ APPLY FILTERS
        filterset = QuestionFilter(request.GET, queryset=questions)
        if not filterset.is_valid():
            return get_error_response('Invalid filter parameters')

        filtered_questions = filterset.qs

        # 3️⃣1️⃣ APPLY SORTING
        ordering = request.query_params.get("ordering")

        if ordering in ["updated_at", "-updated_at"]:
            filtered_questions = filtered_questions.order_by(ordering)

        # 4️⃣ GLOBAL AVAILABILITY

        # 4️⃣ GLOBAL AVAILABILITY (ALL COURSES, SAME SUBJECT)
        all_course_subject_ids = CourseSubjects.objects.filter(
            subject=base_cs.subject
        ).values_list('id', flat=True)

        all_questions = (
            Question.objects
            .filter(course_subject_id__in=all_course_subject_ids)
            .select_related(
                'course_subject__course',
                'course_subject__subject',
                'topic',
                'sub_topic'
            )
        )

        availability_map = build_question_availability_map(all_questions)

        # 5️⃣ PAGINATION
        paginator = CustomPageNumberPagination()
        paginator.page_size = 15
        paginated_questions = paginator.paginate_queryset(filtered_questions, request)

        # 6️⃣ SERIALIZE
        questions_serializer = QuestionListSerializer(
            paginated_questions,
            many=True,
            context={
                'request': request,
                'availability_map': availability_map
            }
        )

        topics_serializer = TopicSerializer(topics, many=True)

        return paginator.get_paginated_response({
            'same_course': base_cs.course.name,
            'same_subject': base_cs.subject.name,
            'questions': questions_serializer.data,
            'topics': topics_serializer.data
        })


    @action(detail=False, methods=['GET'], permission_classes=[IsAdminOrContentDeveloperOrFacultyOrStudent],
            url_path='(?P<course_subject_id>\d+)/topics')
    def list_topics_by_subject(self, request, course_subject_id=None):
        if not course_subject_id:
            self.logger.exception('Error processing the request because no course subject id was provided')
            return get_error_response('Subject is mandatory')

        topics = Topic.objects.filter(course_subject_id=course_subject_id)

        topics_serializer = TopicSerializer(topics, many=True)

        return Response(data=topics_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['GET'], url_path='students')
    def list_students_for_course(self, request, pk=None, *args, **kwargs):
        course = Course.get_course_by_id(course_id=pk)
        students = course.get_enrolled_students()

        # Apply pagination
        paginator = CustomPageNumberPagination()
        paginator.page_size = 15
        paginated_students = paginator.paginate_queryset(students, request)

        # Serialize page of students
        serializer = StudentSerializer(paginated_students, many=True)

        # Return the paginated response
        return paginator.get_paginated_response(serializer.data)


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.get_all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdmin]

    def create(self, request, *args, **kwargs):
        return super(SubjectViewSet, self).create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super(SubjectViewSet, self).update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        # instance.is_active = False
        # instance.updated_at = timezone.now()
        # instance.save()
        instance.delete()

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin], url_path='deactivate')
    def deactivate_subject(self, request, pk=None):
        try:
            subject = self.get_object()
            # subject.is_active = False
            # subject.updated_at = timezone.now()
            # subject.save()
            subject.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Subject.DoesNotExist:
            return Response({'detail': 'Subject not found.'}, status=status.HTTP_404_NOT_FOUND)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200




import re
from html import unescape


def clean_email_text(value):
    """Convert HTML-formatted text to readable plain text."""
    if value is None:
        return ""

    value = str(value)
    value = re.sub(
        r"<br\s*/?>",
        "\n",
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(
        r"</p\s*>",
        "\n",
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(r"<[^>]+>", "", value)

    return unescape(value).strip()


def get_question_email_snapshot(question):
    """Capture the question data required by the correction emails."""
    return {
        "question_id": question.id,
        "srno": question.srno,
        "description": question.description or "",
        "options": question.options or [],
    }


def format_options_for_email(options):
    """Format options and correct-answer markers for the change summary."""
    if not options:
        return "No options available"

    if isinstance(options, dict):
        options = list(options.values())

    if not isinstance(options, list):
        return clean_email_text(options)

    lines = []

    for index, option in enumerate(options):
        if isinstance(option, dict):
            label = (
                option.get("label")
                or option.get("key")
                or option.get("option_label")
                or chr(65 + index)
            )

            text = clean_email_text(
                option.get("description")
                or option.get("text")
                or option.get("value")
                or option.get("option")
                or ""
            )

            correct = (
                option.get("is_correct", False)
                or option.get("correct", False)
                or option.get("is_answer", False)
            )

            line = f"{label}. {text}"

            if correct:
                line += " [Correct Answer]"

            lines.append(line)

        else:
            lines.append(
                f"{chr(65 + index)}. {clean_email_text(option)}"
            )

    return "\n".join(lines)


def get_question_field_changes(before, after):
    """Return only changes to the description and options."""
    changes = []

    if before.get("description") != after.get("description"):
        changes.append({
            "field": "description",
            "label": "Question Description",
            "before": clean_email_text(
                before.get("description")
            ) or "Not provided",
            "after": clean_email_text(
                after.get("description")
            ) or "Not provided",
        })

    if before.get("options") != after.get("options"):
        changes.append({
            "field": "options",
            "label": "Options / Correct Answer",
            "before": format_options_for_email(
                before.get("options")
            ),
            "after": format_options_for_email(
                after.get("options")
            ),
        })

    return changes



class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.get_all()
    serializer_class = CreateQuestionSerializer
    logger = logging.getLogger('Questions')
    pagination_class = StandardResultsSetPagination

    @staticmethod
    def get_client_ip(request):
        """Helper to extract client IP address safely."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]  # take first if multiple
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @action(detail=False, methods=['get'], url_path='export-by-subtopics', permission_classes=[IsAdminOrContentDeveloper])
    def export_by_subtopics(self, request):
        """
        Export questions for given sub_topic_ids and course_subject_id into CSV.
        Example: ?course_subject_id=10&sub_topic_ids=1,21,3,5,6
        """
        course_subject_id = request.query_params.get("course_subject_id")
        sub_topic_ids = request.query_params.get("sub_topic_ids")

        if not course_subject_id or not sub_topic_ids:
            return Response(
                {"error": "Both course_subject_id and sub_topic_ids are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            sub_topic_ids = [int(x) for x in sub_topic_ids.split(",") if x.strip()]
        except ValueError:
            return Response({"error": "sub_topic_ids must be a comma-separated list of integers."},
                            status=status.HTTP_400_BAD_REQUEST)

        # ✅ Fetch questions
        questions = Question.objects.filter(
            course_subject_id=course_subject_id,
            sub_topic_id__in=sub_topic_ids
        ).select_related(
            "course_subject__course",
            "course_subject__subject",
            "sub_topic",
            "topic",
        )

        # ✅ CSV Response
        response = HttpResponse(content_type="text/csv")
        filename = f"questions_by_subtopics_{datetime.datetime.now().strftime('%Y%m%d')}.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            "ID", "Course", "Subject", "Topic", "Sub Topic", "Description",
            "Question Type", "Subtype", "Options", "Difficulty", "Test Type",
            "Directions", "Explanation", "Srno", "Created At", "Updated At"
        ])

        for q in questions:
            writer.writerow([
                q.id,
                q.course_subject.course.name if q.course_subject else "",
                q.course_subject.subject.name if q.course_subject else "",
                q.topic.name if q.topic else "",
                q.sub_topic.name if q.sub_topic else "",   # ✅ sub_topic name instead of id
                q.description,
                q.question_type,
                q.question_subtype,
                q.options,
                q.difficulty,
                q.test_type,
                q.directions,
                q.explanation,
                q.srno,
                q.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                q.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            ])

        return response


    @action(detail=False, methods=["get"], url_path="export_by_question")
    def export_by_question(self, request):
        course_id = request.query_params.get("course_id")

        if not course_id:
            return Response(
                {"error": "course_id is required"},
                status=400
            )

        questions = (
            Question.objects
            .filter(course_subject__course_id=course_id)
            .select_related(
                "course_subject__course",
                "course_subject__subject",
                "topic",
                "sub_topic",
            )
            .order_by(
                "course_subject__subject__name",
                "srno"
            )
        )

        if not questions.exists():
            return Response(
                {"error": "No questions found."},
                status=404
            )

        wb = Workbook()
        ws = wb.active
        ws.title = "Questions"

        ws.append([
            "Sr No",
            "Question ID",
            "Course",
            "Subject",
            "Topic",
            "Sub Topic",
            "Question",
            "Reading Passage",
            "Option A",
            "Option B",
            "Option C",
            "Option D",
            "Correct Answer",
            "Question Type",
            "Question Sub Type",
            "Difficulty",
            "Test Type",
            "Explanation",
        ])

        for index, q in enumerate(questions, start=1):

            option_values = []
            correct_answers = []

            options = q.options or []

            # If whole options field is stored as JSON string
            if isinstance(options, str):
                try:
                    options = json.loads(options)
                except Exception:
                    options = []

            for opt in options:

                # If each option itself is a JSON string
                if isinstance(opt, str):
                    try:
                        opt = json.loads(opt)
                    except Exception:
                        option_values.append(strip_tags(opt))
                        continue

                if isinstance(opt, dict):
                    text = strip_tags(str(opt.get("description", "")))
                    option_values.append(text)

                    if opt.get("is_correct"):
                        correct_answers.append(text)

                else:
                    option_values.append(strip_tags(str(opt)))

            option1 = option_values[0] if len(option_values) > 0 else ""
            option2 = option_values[1] if len(option_values) > 1 else ""
            option3 = option_values[2] if len(option_values) > 2 else ""
            option4 = option_values[3] if len(option_values) > 3 else ""

            ws.append([
                index,
                q.id,
                q.course_subject.course.name,
                q.course_subject.subject.name,
                q.topic.name if q.topic else "",
                q.sub_topic.name if q.sub_topic else "",
                strip_tags(q.description or ""),
                strip_tags(q.reading_comprehension_passage or ""),
                option1,
                option2,
                option3,
                option4,
                ", ".join(correct_answers),
                q.question_type,
                q.question_subtype,
                q.difficulty,
                q.test_type,
                strip_tags(q.explanation or ""),
            ])

        # Auto-size columns
        for column_cells in ws.columns:
            max_length = 0

            for cell in column_cells:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except Exception:
                    pass

            ws.column_dimensions[column_cells[0].column_letter].width = min(max_length + 5, 80)

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="questions_course_{course_id}.xlsx"'
        )

        wb.save(response)

        return response


    @action(detail=False, methods=['get'], url_path='duplicates')
    def find_duplicates(self, request):

        import json
        import datetime
        from collections import defaultdict
        from django.db.models import Count
        from django.http import HttpResponse
        from openpyxl import Workbook
        from test_manager.models import Question, CourseSubjects

        export_format = request.GET.get("export", "xlsx")

        # Get all course_subjects
        course_subjects = CourseSubjects.objects.select_related("course", "subject")

        wb = Workbook()
        wb.remove(wb.active)  # remove default sheet

        sheets_created = 0

        for cs in course_subjects:

            duplicates = (
                Question.objects
                .filter(course_subject=cs)
                .values("description", "options")
                .annotate(count=Count("id"))
                .filter(count__gt=1)
            )

            if not duplicates.exists():
                continue  # skip course with no duplicates

            duplicate_questions = (
                Question.objects
                .filter(course_subject=cs)
                .select_related("course_subject__course", "course_subject__subject")
                .order_by("description", "srno")
            )

            grouped = defaultdict(list)

            for q in duplicate_questions:
                try:
                    options_key = json.dumps(q.options, sort_keys=True)
                except:
                    options_key = str(q.options)

                grouped[(q.description, options_key)].append(q)

            sheet_name = cs.course.name[:31]
            ws = wb.create_sheet(title=sheet_name)

            ws.append([
                "Srno",
                "Course",
                "Subject",
                "Question Type",
                "Subtype",
                "Difficulty",
                "Test Type",
            ])

            for _, questions in grouped.items():

                if len(questions) < 2:
                    continue

                for q in questions:
                    ws.append([
                        q.srno,
                        q.course_subject.course.name,
                        q.course_subject.subject.name,
                        q.question_type,
                        q.question_subtype,
                        q.difficulty,
                        q.test_type,
                    ])

                ws.append([])
                ws.append([])

            sheets_created += 1

        if sheets_created == 0:
            return Response(
                {"message": "No duplicate questions found."},
                status=200
            )

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        filename = f"duplicate_questions_all_courses_{datetime.datetime.now().strftime('%Y%m%d')}.xlsx"
        response["Content-Disposition"] = f'attachment; filename={filename}'

        wb.save(response)
        return response




    
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAdmin],
        url_path="logs-and-daily-count",
    )
    def logs_and_daily_count(self, request):
        """
        Daily question counts and paginated audit logs.

        Filters:
            ?date=YYYY-MM-DD
            ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
            ?srno=123
            ?name=John

        If no date is supplied, defaults to the last 7 calendar days,
        including today.
        """

        # --------------------------------------------------
        # 1. Parse date filters
        # --------------------------------------------------
        date_str = request.query_params.get("date")
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")

        try:
            if date_str:
                start_date = datetime.datetime.strptime(
                    date_str, "%Y-%m-%d"
                ).date()
                end_date = start_date

            elif start_date_str or end_date_str:
                if start_date_str:
                    start_date = datetime.datetime.strptime(
                        start_date_str, "%Y-%m-%d"
                    ).date()
                else:
                    start_date = datetime.datetime.strptime(
                        end_date_str, "%Y-%m-%d"
                    ).date()

                if end_date_str:
                    end_date = datetime.datetime.strptime(
                        end_date_str, "%Y-%m-%d"
                    ).date()
                else:
                    end_date = start_date

            else:
                end_date = timezone.localdate()
                start_date = end_date - datetime.timedelta(days=6)

        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if start_date > end_date:
            return Response(
                {"error": "start_date cannot be after end_date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # 2. Common filters
        # --------------------------------------------------
        srno = request.query_params.get("srno")
        name = request.query_params.get("name")

        if srno:
            try:
                srno = int(srno)
                if srno < 0:
                    raise ValueError
            except (TypeError, ValueError):
                return Response(
                    {"error": "srno must be a non-negative integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        question_filter = Q()
        log_question_filter = Q()

        if srno is not None and srno != "":
            question_filter &= Q(srno=srno)

            # Matches active questions and deleted questions.
            log_question_filter &= (
                Q(question__srno=srno)
                | Q(question_srno_snapshot=srno)
            )

        if name:
            question_filter &= Q(created_by__name__icontains=name)

        # --------------------------------------------------
        # 3. Daily added counts
        # --------------------------------------------------
        daily_added = (
            Question.objects.filter(
                created_at__date__range=(start_date, end_date)
            )
            .filter(question_filter)
            .values("created_at__date")
            .annotate(total=Count("id"))
            .order_by("created_at__date")
        )

        # --------------------------------------------------
        # 4. Daily edited counts
        # --------------------------------------------------
        daily_updated = (
            QuestionLog.objects.filter(
                action="EDIT",
                timestamp__date__range=(start_date, end_date),
            )
            .filter(log_question_filter)
            .filter(Q(user__name__icontains=name) if name else Q())
            .values("timestamp__date")
            .annotate(total=Count("id"))
            .order_by("timestamp__date")
        )

        # --------------------------------------------------
        # 5. Daily deleted counts
        # --------------------------------------------------
        daily_deleted = (
            QuestionLog.objects.filter(
                action="DELETE",
                timestamp__date__range=(start_date, end_date),
            )
            .filter(log_question_filter)
            .filter(Q(user__name__icontains=name) if name else Q())
            .values("timestamp__date")
            .annotate(total=Count("id"))
            .order_by("timestamp__date")
        )

        # --------------------------------------------------
        # 6. Daily suggestion counts
        # --------------------------------------------------
        daily_suggestions = (
            Suggestion.objects.filter(
                created_at__date__range=(start_date, end_date)
            )
            .filter(
                Q(question__srno=srno) if srno is not None else Q()
            )
            .filter(
                Q(created_by__name__icontains=name) if name else Q()
            )
            .values("created_at__date")
            .annotate(total=Count("id"))
            .order_by("created_at__date")
        )

        # --------------------------------------------------
        # 7. Build summary by date
        # --------------------------------------------------
        day_map = {}

        def get_day(day):
            if day not in day_map:
                day_map[day] = {
                    "date": day,
                    "total_added": 0,
                    "total_updated": 0,
                    "total_deleted": 0,
                    "total_suggestions": 0,
                }
            return day_map[day]

        for item in daily_added:
            get_day(item["created_at__date"])[
                "total_added"
            ] = item["total"]

        for item in daily_updated:
            get_day(item["timestamp__date"])[
                "total_updated"
            ] = item["total"]

        for item in daily_deleted:
            get_day(item["timestamp__date"])[
                "total_deleted"
            ] = item["total"]

        for item in daily_suggestions:
            get_day(item["created_at__date"])[
                "total_suggestions"
            ] = item["total"]

        day_wise_summary = sorted(
            day_map.values(),
            key=lambda item: item["date"],
            reverse=True,
        )

        daily_summary = {
            "date_range": f"{start_date} to {end_date}",
            "total_added": sum(
                item["total_added"] for item in day_wise_summary
            ),
            "total_updated": sum(
                item["total_updated"] for item in day_wise_summary
            ),
            "total_deleted": sum(
                item["total_deleted"] for item in day_wise_summary
            ),
            "total_suggestions": sum(
                item["total_suggestions"] for item in day_wise_summary
            ),
            "day_wise": day_wise_summary,
        }

        # --------------------------------------------------
        # 8. Fetch logs, including deleted questions
        # --------------------------------------------------
        logs_qs = (
            QuestionLog.objects.select_related("question", "user")
            .filter(timestamp__date__range=(start_date, end_date))
            .filter(log_question_filter)
            .filter(Q(user__name__icontains=name) if name else Q())
            .order_by("-timestamp", "-id")
        )

        # --------------------------------------------------
        # 9. Paginate logs
        # --------------------------------------------------
        paginator = StandardResultsSetPagination()
        paginated_logs = paginator.paginate_queryset(
            logs_qs, request
        )

        logs_data = []

        for log in paginated_logs:
            question_id = (
                log.question_id_snapshot
                if log.question_id_snapshot is not None
                else (
                    log.question.id if log.question else None
                )
            )

            question_srno = (
                log.question_srno_snapshot
                if log.question_srno_snapshot is not None
                else (
                    log.question.srno if log.question else None
                )
            )

            logs_data.append({
                "id": log.id,
                "question_id": question_id,
                "srno": question_srno,
                "user": log.user.name if log.user else None,
                "action": log.get_action_display(),
                "timestamp": log.timestamp,
                "ip_address": log.ip_address,
            })

        # --------------------------------------------------
        # 10. Return response
        # --------------------------------------------------
        return paginator.get_paginated_response({
            "daily_question_count": daily_summary,
            "logs": logs_data,
        })




    @permission_classes([IsAdminOrContentDeveloper])
    @action(detail=False, methods=['get'], url_path='question-count')
    def question_count_by_course_subject(self, request):
        """
        Returns question count grouped by Course and Subject,
        with counts of self-practice, full-length,
        and active/inactive questions.
        Groups results by course so same course rows come together.
        """
        data = []

        # Fetch all course_subjects with related course + subject
        course_subjects = CourseSubjects.objects.select_related("course", "subject").order_by("course__name", "subject__name")

        for cs in course_subjects:
            qs = Question.objects.filter(course_subject=cs)

            data.append({
                "course": cs.course.name,
                "subject": cs.subject.name,
                "total_questions": qs.count(),
                "active_questions": qs.filter(is_active=True).count(),
                "inactive_questions": qs.filter(is_active=False).count(),
                "total_self_practice_questions": qs.filter(test_type=Question.SELF_PRACTICE_TEST_TYPE).count(),
                "total_full_length_questions": qs.filter(test_type=Question.FULL_LENGTH_TEST_TYPE).count(),
            })

        return Response(data)




    @action(detail=False, methods=['get'], url_path='download-report')
    def download_report(self, request):
        questions = Question.objects.all().select_related(
            'course_subject__course', 'course_subject__subject', 'topic', 'sub_topic'
        )

        # Prepare workbook
        wb = Workbook()
        wb.remove(wb.active)  # Remove default sheet

        grouped_data = {}
        for q in questions:
            course_name = q.course_subject.course.name
            subject_name = q.course_subject.subject.name
            topic_name = getattr(q.topic, 'name', "N/A")
            sub_topic_name = getattr(q.sub_topic, 'name', "N/A")
            difficulty = q.difficulty
            test_type = 'FLT' if q.test_type == Question.FULL_LENGTH_TEST_TYPE else 'Practice'

            key = (course_name, subject_name, topic_name, sub_topic_name, difficulty, test_type)
            grouped_data[key] = grouped_data.get(key, 0) + 1

        # Sort and group by course
        sorted_items = sorted(
            grouped_data.items(),
            key=lambda x: (x[0][0], x[0][1], x[0][2], x[0][3], x[0][4], x[0][5])
        )

        # Separate data by course
        course_data = {}
        for (course, subject, topic, sub_topic, difficulty, test_type), count in sorted_items:
            if course not in course_data:
                course_data[course] = []
            course_data[course].append([subject, topic, sub_topic, difficulty, test_type, count])

        # Create sheet per course
        for course, rows in course_data.items():
            ws = wb.create_sheet(title=course[:31])  # Excel sheet name max length = 31
            ws.append(['Subject', 'Topic', 'Sub Topic', 'Difficulty', 'Test Type', 'Question Count'])
            for row in rows:
                ws.append(row)
            ws.append([])
            ws.append(['Total Questions', '', '', '', '', sum(r[-1] for r in rows)])

        # Prepare response
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        filename = f"questions_report_{datetime.datetime.now().strftime('%Y%m%d')}.xlsx"
        response['Content-Disposition'] = f'attachment; filename={filename}'
        wb.save(response)
        return response




    @permission_classes([IsAdminOrContentDeveloper])
    def create(self, request, *args, **kwargs):
        data = request.data
        data['created_by'] = request.user.id
        data['updated_by'] = request.user.id
        data['is_active'] = request.user.role.name == 'admin'

        course_subject_id = data.get('course_subject')
        test_type = data.get('test_type')

        max_srno = Question.objects.filter(course_subject_id=course_subject_id, test_type=test_type)\
            .aggregate(Max('srno'))['srno__max'] or 0
        data['srno'] = max_srno + 1

        context = {'request': request}
        serializer = CreateQuestionSerializer(data=data, context=context)

        try:
            serializer.is_valid(raise_exception=True)
            question = serializer.save()

            # ✅ Log the addition
            QuestionLog.objects.create(
                question=question,
                user=request.user,
                action='ADD',
                ip_address=self.get_client_ip(request)

            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @permission_classes([IsAdminOrContentDeveloper])
    @action(
        detail=False,
        methods=['post'],
        url_path='create-multiple'
    )
    def create_multiple_questions(self, request, *args, **kwargs):

        data = request.data

        common_description = data.get('description')
        common_options = data.get('options')

        common_reading_comprehension_passage = data.get(
            'reading_comprehension_passage',
            None
        )

        common_question_type = data.get('question_type')
        common_directions = data.get('directions', None)
        common_explanation = data.get('explanation', None)

        questions_data = data.get('questions_data', [])

        question_subtype = data.get('question_subtype')

        context = {
            'request': request,
            'question_type': common_question_type,
            'question_subtype': question_subtype
        }

        created_questions = []

        srno_tracker = {}

        # Keep serializer available for error handling
        serializer = None

        try:

            max_srno = (
                Question.objects.aggregate(
                    Max('srno')
                )['srno__max'] or 0
            )

            srno_tracker['global'] = max_srno

            with transaction.atomic():

                for question_data in questions_data:

                    srno_tracker['global'] += 1

                    individual_data = {
                        'course_subject':
                            question_data.get('course_subject'),

                        'description':
                            common_description,

                        'options':
                            common_options,

                        'reading_comprehension_passage':
                            common_reading_comprehension_passage,

                        'question_type':
                            common_question_type,

                        'question_subtype':
                            question_subtype,

                        'difficulty':
                            question_data.get('difficulty'),

                        'test_type':
                            question_data.get('test_type'),

                        'topic':
                            question_data.get('topic'),

                        'sub_topic':
                            question_data.get(
                                'sub_topic',
                                None
                            ),

                        'created_by':
                            request.user.id,

                        'updated_by':
                            request.user.id,

                        'is_active':
                            question_data.get(
                                'is_active',
                                True
                                if request.user.role.name == 'admin'
                                else False
                            ),

                        'show_calculator':
                            question_data.get(
                                'show_calculator',
                                False
                            ),

                        'directions':
                            common_directions,

                        'explanation':
                            common_explanation,

                        'srno':
                            srno_tracker['global']
                    }

                    serializer = CreateQuestionSerializer(
                        data=individual_data,
                        context=context
                    )

                    serializer.is_valid(
                        raise_exception=True
                    )

                    validated_data = serializer.validated_data

                    # ==================================================
                    # DUPLICATE VALIDATION
                    # ==================================================

                    course_subject = validated_data.get(
                        'course_subject'
                    )

                    topic = validated_data.get(
                        'topic'
                    )

                    sub_topic = validated_data.get(
                        'sub_topic'
                    )

                    description = validated_data.get(
                        'description'
                    )

                    options = validated_data.get(
                        'options'
                    )

                    existing_questions = (
                        Question.objects
                        .filter(
                            description=description
                        )
                        .select_related(
                            'course_subject__course',
                            'course_subject__subject',
                            'topic',
                            'sub_topic'
                        )
                    )

                    duplicate_question = None

                    for existing_question in existing_questions:

                        # ------------------------------------------
                        # SAME COURSE + SUBJECT
                        # ------------------------------------------

                        if (
                            existing_question.course_subject_id
                            != course_subject.id
                        ):
                            continue

                        # ------------------------------------------
                        # SAME TOPIC
                        # ------------------------------------------

                        existing_topic_name = (
                            existing_question.topic.name
                            if existing_question.topic
                            else None
                        )

                        if existing_topic_name != topic:
                            continue

                        # ------------------------------------------
                        # SAME SUB TOPIC
                        # ------------------------------------------

                        existing_sub_topic_name = (
                            existing_question.sub_topic.name
                            if existing_question.sub_topic
                            else None
                        )

                        if existing_sub_topic_name != sub_topic:
                            continue

                        # ------------------------------------------
                        # SAME OPTIONS
                        # ------------------------------------------

                        if existing_question.options != options:
                            continue

                        # ------------------------------------------
                        # DUPLICATE FOUND
                        # ------------------------------------------

                        duplicate_question = existing_question
                        break

                    # ==================================================
                    # RETURN DUPLICATE DETAILS
                    # ==================================================

                    if duplicate_question:

                        duplicate_course = (
                            duplicate_question
                            .course_subject
                            .course
                        )

                        duplicate_subject = (
                            duplicate_question
                            .course_subject
                            .subject
                        )

                        return Response(
                            {
                                'success': False,
                                'message': (
                                    'Duplicate question already exists.'
                                ),
                                'duplicate_question': {
                                    'id': duplicate_question.id,
                                    'srno': duplicate_question.srno,

                                    'course': {
                                        'id': duplicate_course.id,
                                        'name': duplicate_course.name
                                    },

                                    'subject': {
                                        'id': duplicate_subject.id,
                                        'name': duplicate_subject.name
                                    },

                                    'course_subject_id': (
                                        duplicate_question
                                        .course_subject_id
                                    ),

                                    'topic': (
                                        duplicate_question.topic.name
                                        if duplicate_question.topic
                                        else None
                                    ),

                                    'sub_topic': (
                                        duplicate_question.sub_topic.name
                                        if duplicate_question.sub_topic
                                        else None
                                    )
                                }
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # ==================================================
                    # CREATE QUESTION
                    # ==================================================

                    created_question = serializer.save()

                    created_questions.append(
                        created_question
                    )

                    # ==================================================
                    # QUESTION LOG
                    # ==================================================

                    QuestionLog.objects.create(
                        question=created_question,
                        question_id_snapshot=created_question.id,
                        question_srno_snapshot=created_question.srno,
                        user=request.user,
                        action='ADD',
                        ip_address=self.get_client_ip(request)
                    )

            # ==========================================================
            # SUCCESS RESPONSE
            # ==========================================================

            return Response(
                CreateQuestionSerializer(
                    created_questions,
                    many=True,
                    context=context
                ).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:

            self.logger.error(
                f'Error in create_multiple_questions: {e}'
            )

            return get_error_response_for_serializer(
                logger=self.logger,
                serializer=serializer,
                data=request.data
            )


    
    @permission_classes([IsAdmin])
    def update(self, request, pk=None, *args, **kwargs):
        import copy

        try:
            base_question = Question.objects.select_related(
                "topic", "sub_topic"
            ).get(id=pk)
        except Question.DoesNotExist:
            return get_error_response("Invalid question id")

        course_updates = request.data.get("course_updates")

        if not course_updates or not isinstance(course_updates, list):
            return get_error_response(
                "course_updates must be provided as a list"
            )

        course_subject_ids = [
            cu["course_subject_id"] for cu in course_updates
        ]

        candidates = Question.objects.select_related(
            "topic", "sub_topic"
        ).filter(course_subject_id__in=course_subject_ids)

        questions_to_update = filter_questions_by_signature(
            base_question=base_question,
            candidates=candidates,
        )

        if not questions_to_update:
            return get_error_response(
                "No matching questions found to update"
            )

        status_map = {
            cu["course_subject_id"]: cu.get("is_active", True)
            for cu in course_updates
        }

        updated_questions = []
        options_changed_question_ids = []
        question_changes = []

        context = {"request": request}

        with transaction.atomic():
            for question in questions_to_update:
                update_data = request.data.copy()

                # Keep each cloned question in its own course.
                update_data.pop("course", None)
                update_data.pop("course_subject", None)
                update_data.pop("course_updates", None)

                serializer = self.get_serializer(
                    question,
                    data=update_data,
                    partial=True,
                    context=context,
                )

                serializer.is_valid(raise_exception=True)

                # Detect whether the answer/options are changing.
                options_changed = has_answer_changed(
                    question,
                    serializer.validated_data,
                )

                # Capture the original question before saving.
                before_snapshot = None

                if options_changed:
                    before_snapshot = copy.deepcopy(
                        get_question_email_snapshot(question)
                    )

                updated_question = serializer.save(
                    is_active=status_map.get(
                        question.course_subject_id,
                        question.is_active,
                    ),
                    updated_by=request.user,
                    updated_at=timezone.now(),
                )

                updated_questions.append(updated_question)

                if options_changed:
                    options_changed_question_ids.append(
                        updated_question.id
                    )

                    # Capture the corrected question.
                    updated_question.refresh_from_db()

                    after_snapshot = copy.deepcopy(
                        get_question_email_snapshot(updated_question)
                    )

                    changes = get_question_field_changes(
                        before_snapshot,
                        after_snapshot,
                    )

                    question_changes.append({
                        "question_id": updated_question.id,
                        "srno": after_snapshot.get("srno"),
                        "before": before_snapshot,
                        "after": after_snapshot,
                        "changes": changes,
                    })

                QuestionLog.objects.create(
                    question=updated_question,
                    user=request.user,
                    action="EDIT",
                    ip_address=self.get_client_ip(request),
                )

        affected_student_ids = []

        if options_changed_question_ids:
            # Recalculate affected test results.
            re_evaluate_question_answers_sync(
                options_changed_question_ids
            )

            # Full Length Test students.
            fl_students = QuestionAnswer.objects.filter(
                question_id__in=options_changed_question_ids
            ).values_list(
                "result__test_submission__student_id",
                flat=True,
            )

            # Practice Test students.
            pt_students = PracticeQuestionAnswer.objects.filter(
                question_id__in=options_changed_question_ids
            ).values_list(
                "practice_test_result__practice_test__student_id",
                flat=True,
            )

            affected_student_ids = list(
                set(fl_students) | set(pt_students)
            )

            if affected_student_ids:
                send_question_update_email.delay(
                    student_ids=affected_student_ids,
                    question_ids=options_changed_question_ids,
                    question_changes=question_changes,
                )

        return Response({
            "message": "Questions updated successfully",
            "updated_count": len(updated_questions),
            "options_changed": bool(options_changed_question_ids),
            "affected_students": len(affected_student_ids),
            "updated_question_ids": [
                q.id for q in updated_questions
            ],
        })







    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user, updated_at=timezone.now())

    
    @permission_classes([IsAdminOrContentDeveloperOrFacultyOrStudent])
    def retrieve(self, request, pk=None, *args, **kwargs):
        # 1. First search the active Question table
        try:
            instance = Question.get_question_by_id(question_id=pk)

        except (Question.DoesNotExist, Http404):
            instance = None

        # 2. If not found, search DeletedQuestion
        if instance is None:
            deleted_record = (
                DeletedQuestion.objects
                .filter(original_question_id=pk)
                .order_by("-deleted_at")
                .first()
            )

            if not deleted_record:
                return Response(
                    {"detail": "Resource not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            saved_data = deleted_record.question_data

            # Django serializer stores data as:
            # {"model": "...", "pk": 5849, "fields": {...}}
            if isinstance(saved_data, dict) and "fields" in saved_data:
                question_data = {
                    **saved_data["fields"],
                    "id": saved_data.get("pk", deleted_record.original_question_id),
                }
            else:
                question_data = saved_data

            # Return a consistent response for the frontend.
            return Response({
                "detail": question_data,
                "topics": [],
                "doubt_created": False,
                "doubt": "",
                "doubt_id": None,
                "doubt_details": None,
                "is_deleted": True,
            }, status=status.HTTP_200_OK)

        # 3. Normal response for an existing question
        serializer = QuestionListSerializer(
            instance=instance,
            context={
                "request": request,
                "test_submission_id": request.GET.get("test_submission_id"),
                "practice_test_result_id": request.GET.get(
                    "practice_test_result_id"
                ),
            },
        )

        topics = Topic.objects.filter(
            course_subject_id=instance.course_subject_id
        )
        topics_serializer = TopicSerializer(topics, many=True)

        doubt = None

        if request.user.is_authenticated:
            doubt = (
                Doubt.objects.filter(
                    student=request.user,
                    question=instance,
                )
                .order_by("-id")
                .first()
            )

        return Response({
            "detail": serializer.data,
            "topics": topics_serializer.data,
            "doubt_created": doubt is not None,
            "doubt": (
                "You have already created a doubt about this question."
                if doubt else ""
            ),
            "doubt_id": doubt.id if doubt else None,
            "doubt_details": (
                {
                    "id": doubt.id,
                    "description": doubt.description,
                }
                if doubt else None
            ),
            "is_deleted": False,
        })
    


    @permission_classes([IsAdminOrContentDeveloper])
    def destroy(self, request, pk=None, *args, **kwargs):
        instance = Question.get_question_by_id(question_id=pk)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        # instance.is_active = False
        # instance.updated_at = timezone.now()
        # instance.save()
        instance.delete()

    
    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[IsAdminOrContentDeveloper],
        url_path="deactivate",
    )
    def deactivate_question(self, request, pk=None):
        question = Question.get_question_by_id(question_id=pk)

        client_ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.META.get("REMOTE_ADDR")

        with transaction.atomic():
            question_id = question.id
            question_srno = question.srno

            # Save the complete question before deleting it
            question_data = json.loads(
                django_serializers.serialize("json", [question])
            )[0]

            # Preserve the deleted question
            DeletedQuestion.objects.create(
                original_question_id=question_id,
                question_data=question_data,
                deleted_by=request.user,
            )

            # Record a permanent DELETE log
            QuestionLog.objects.create(
                question=question,
                question_id_snapshot=question_id,
                question_srno_snapshot=question_srno,
                user=request.user,
                action="DELETE",
                ip_address=client_ip,
            )

            # Remove the original question
            question.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin], url_path='activate')
    def activate_question(self, request, pk=None):
        question = Question.get_question_by_id(question_id=pk)
        question.is_active = True
        question.updated_at = timezone.now()
        question.save()
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrContentDeveloper], url_path='soft-deactivate')
    def soft_deactivate_question(self, request, pk=None):
        """
        Soft deactivate a question (set is_active=False instead of deleting).
        """
        try:
            question = Question.get_question_by_id(question_id=pk)
            question.is_active = False
            question.updated_at = timezone.now()
            question.updated_by = request.user
            question.save()
            return Response({"message": "Question deactivated successfully."}, status=status.HTTP_200_OK)
        except Question.DoesNotExist:
            return Response({"error": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrContentDeveloperOrFacultyOrStudent],
        url_path='details')
    def get_questions_details(self, request):
        question_ids = request.data.get('question_ids', [])

        try:
            question_ids = [int(id) for id in question_ids]
        except ValueError:
            return Response({"error": "Invalid question ID in the list, must be all integers."},
                            status=status.HTTP_400_BAD_REQUEST)

        if not question_ids:
            return Response({"error": "No question IDs provided."}, status=status.HTTP_400_BAD_REQUEST)

        questions = Question.get_questions_for_ids(question_ids)
        question_dict = {question.id: question for question in questions}

        # Non-RC first
        ordered_questions = [
            question_dict[qid] for qid in question_ids
            if qid in question_dict and question_dict[qid].question_subtype != Question.MCQ_READING_COMPREHENSION
        ]

        # RC last
        reading_comprehension_questions = [
            question_dict[qid] for qid in question_ids
            if qid in question_dict and question_dict[qid].question_subtype == Question.MCQ_READING_COMPREHENSION
        ]

        ordered_questions.extend(reading_comprehension_questions)

        serializer = QuestionListSerializer(ordered_questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    logger = logging.getLogger('Material')
    aws_storage_client = AwsStorageClient(logger=logger)
    source = 'study_material'

    @permission_classes([IsAdminOrContentDeveloper])
    def update(self, request, pk=None):
        instance = self.get_object()
        data = request.data.copy()
        data['updated_by'] = request.user.id

        # Handle file upload if new file provided
        if data.get('url') is None and 'file' in request.FILES:
            uploaded_file = request.FILES['file']
            fs = FileSystemStorage()
            temp_file_name = uploaded_file.name.split('.')
            file_name = temp_file_name[0] + '_' + str(uuid.uuid4().hex)[:6] + '.' + temp_file_name[1]
            saved_file_name = fs.save(file_name, uploaded_file)
            full_path_to_file = f"{settings.MEDIA_ROOT}/{saved_file_name}"

            # Upload to S3
            self.aws_storage_client.upload_file_from_fs(
                source=self.source,
                filename=saved_file_name,
                full_path_to_file=full_path_to_file,
                content_type=uploaded_file.content_type
            )

            # Delete old file from S3 if exists
            if instance.uploaded_file_name:
                self.aws_storage_client.delete_file(source=self.source, filename=instance.uploaded_file_name)

            # Clean up
            fs.delete(saved_file_name)

            # Update file fields
            data['file_name'] = uploaded_file.name
            data['uploaded_file_name'] = saved_file_name
        elif data.get('url'):
            # If updating with a new URL, remove any previously uploaded file
            if instance.uploaded_file_name:
                self.aws_storage_client.delete_file(source=self.source, filename=instance.uploaded_file_name)
                data['file_name'] = None
                data['uploaded_file_name'] = None

        serializer = MaterialSerializer(instance, data=data, partial=True)

        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
        except Exception as e:
            if isinstance(e, ValidationError):
                return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=data)
            else:
                self.logger.exception(f'Error while updating material: {e}')
                return get_error_response(message='Unexpected error occurred while updating material.')

        return Response({'detail': 'Material updated successfully'}, status=status.HTTP_200_OK)    

    @permission_classes([IsAdminOrContentDeveloper])
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data['created_by'] = request.user.id
        data['updated_by'] = request.user.id

        if data.get('url', None) is None:
            file_uploaded = request.FILES['file']
            fs = FileSystemStorage()  # defaults to MEDIA_ROOT
            temp_file_name = file_uploaded.name.split('.')
            file_name = temp_file_name[0] + '_' + str(uuid.uuid4().hex)[:6] + '.' + temp_file_name[1]
            saved_file_name = fs.save(file_name, file_uploaded)
            full_path_to_file = settings.MEDIA_ROOT + '/' + saved_file_name

            data['file_name'] = file_uploaded.name
            data['uploaded_file_name'] = saved_file_name
            self.aws_storage_client.upload_file_from_fs(source=self.source, filename=saved_file_name,
                                                        full_path_to_file=full_path_to_file,
                                                        content_type=file_uploaded.content_type)
            fs.delete(saved_file_name)

        serializer = MaterialSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
        except Exception as e:
            if isinstance(e, ValidationError):
                return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=data)
            else:
                self.logger.exception(f'Exception {e}')
                return get_error_response(message='An unexpected error occurred.')

        return Response({'detail': 'File uploaded successfully'}, status=status.HTTP_200_OK)

    @permission_classes([IsAdminOrContentDeveloperOrFacultyOrStudent])
    def list(self, request, *args, **kwargs):
        user = request.user
        course_subject_filter = self.request.query_params.get('course_subject_id', None)

        if user.role.name == 'student':
            course_subject = CourseSubjects.get_course_subject_by_id(course_subject_filter)
            course_enrollment = CourseEnrollment.get_student_enrollment_using_student_course(student_id=user.id,
                                                                                             course_id=course_subject.course_id)
            if course_enrollment.subscription_type == CourseEnrollment.FREE:
                qs = self.queryset.filter(access_type=Material.FREE_ACCESS_TYPE)
            else:
                qs = self.queryset.all()
        else:
            qs = self.queryset.all()

        if course_subject_filter is not None:
            qs = qs.filter(course_subject_id=course_subject_filter)

        # Apply dynamic filtering
        filter_backends = [DjangoFilterBackend]
        filterset = MaterialFilter(request.GET, queryset=qs, request=request)
        if not filterset.is_valid():
            return get_error_response('Invalid filter parameters')

        materials = filterset.qs

        # Apply pagination
        paginator = CustomPageNumberPagination()
        paginator.page_size = 15
        paginated_materials = paginator.paginate_queryset(materials, request)

        serializer = MaterialListSerializer(paginated_materials, many=True)

        # Return the paginated response
        return paginator.get_paginated_response(serializer.data)

    @permission_classes([IsAdminOrContentDeveloperOrFacultyOrStudent])
    def retrieve(self, request, pk=None, *args, **kwargs):
        material = Material.get_material_by_id(material_id=pk)
        serializer = MaterialDetailsSerializer(material)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @permission_classes([IsAdminOrContentDeveloper])
    def destroy(self, request, pk=None, *args, **kwargs):
        instance = Material.get_material_by_id(material_id=pk)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        self.aws_storage_client.delete_file(source=self.source, filename=instance.uploaded_file_name)
        instance.delete()

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrContentDeveloper], url_path='deactivate')
    def deactivate_material(self, request, pk=None):
        material = Material.get_material_by_id(material_id=pk)
        self.perform_destroy(material)
        return Response(status=status.HTTP_204_NO_CONTENT)
    