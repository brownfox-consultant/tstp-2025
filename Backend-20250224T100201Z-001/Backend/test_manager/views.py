import logging
import random
from collections import defaultdict
from datetime import datetime, timedelta
from django.http import HttpResponse
import csv

from django.db import transaction
from django.db.models import Avg, Q, Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model

from course_manager.filters import PracticeQuestionFilter
from course_manager.models import Question, CourseSubjects, CombinedScore
from notification_manager.models import NotificationTemplate, Notification
from notification_manager.utils import send_notification, mark_notification_as_read
from sTest.permissions import IsAdmin, IsAdminOrMentorOrFacultyOrStudentOrParent, \
    IsAdminOrMentorOrFaculty, IsStudent
from sTest.utils import get_error_response_for_serializer, get_error_response, CustomPageNumberPagination
from test_manager.filters import TestSubmissionFilter, PracticeTestFilter, TestFilter
from test_manager.models import Test, Section, TestSubmission, Result, PracticeTest, PracticeTestResult, \
    AnsweredQuestions, TestFeedback, QuestionAnswer, SectionStats, PracticeQuestionAnswer,SelectionHistory
from test_manager.serializers import TestSerializer, TestListSerializer, ExistingStudentListSerializer, \
    TestSubmissionSerializer, PracticeTestListSerializer, EligibleStudentSerializer, SectionSerializer, \
    TestFeedbackSerializer
from test_manager.utils import calculate_total_questions_required
from user_manager.models import User, Role, StudentMetadata
from collections import defaultdict
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models.functions import TruncDate
from collections import defaultdict
from datetime import timedelta
from django.db.models.functions import TruncDate
from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from sTest.permissions import IsStudent
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime,timedelta
from django.utils import timezone
from django.db.models import Sum, F
from collections import defaultdict
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from test_manager.models import TestSubmission, Result
from course_manager.models import CourseSubjects,Topic, SubTopic
from user_manager.models import User
from django.utils.dateparse import parse_date
from django.utils.timezone import now
from datetime import datetime, timedelta
from django.utils.timezone import make_aware, now
from collections import defaultdict
from django.db.models import Prefetch
from course_manager.models import Subject
from django.core.exceptions import FieldError
from django.utils.dateparse import parse_date
from django.utils.timezone import make_aware, now
from datetime import datetime, timedelta, time
from rest_framework.decorators import action
from rest_framework.response import Response
from collections import defaultdict
from rest_framework.permissions import IsAdminUser
from course_manager.models import Course, CourseSubjects




class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.get_all()
    serializer_class = TestSerializer
    logger = logging.getLogger('Tests')

    @action(detail=True, methods=['POST'], url_path='selection-history')
    def save_selection_history(self, request, pk=None, *args, **kwargs):
        """
        Store user's selection history for a question (for analytics / behavior tracking)
        """
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.data.get('test_submission_id')
        question_id = request.data.get('question_id')
        selected_options = request.data.get('selected_options', [])
        striked_options = request.data.get('striked_options', [])
        action_type = request.data.get('action_type', 'SELECT')

        # Validate
        if not test_submission_id or not question_id:
            return Response({"detail": "Missing test_submission_id or question_id."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            test_submission = TestSubmission.objects.get(id=test_submission_id)
            question = Question.objects.get(id=question_id)
        except (TestSubmission.DoesNotExist, Question.DoesNotExist):
            return Response({"detail": "Invalid submission or question ID."}, status=status.HTTP_400_BAD_REQUEST)

        SelectionHistory.objects.create(
            student=request.user,
            question=question,
            test_submission=test_submission,
            selected_options=selected_options,
            striked_options=striked_options,
            action_type=action_type
        )

        return Response({"detail": "Selection history recorded successfully."}, status=status.HTTP_201_CREATED)

     # ✅ New API to get full-length test list
    @action(detail=False, methods=['GET'], url_path='full-list')
    def get_full_test_list(self, request):
        try:
            course_id = request.query_params.get("course_id")
            student_id = request.query_params.get("student_id")

            tests = Test.objects.filter(is_active=True)

            if course_id:
                tests = tests.filter(course_id=course_id)

            if student_id:
                tests = tests.filter(students__id=student_id)

            data = []
            for test in tests:
                data.append({
                    "id": test.id,
                    "name": test.name,
                    "course_id": test.course.id if test.course else None,
                    "course_name": test.course.name if test.course else None,
                    "test_type": test.test_type,
                    "format_type": test.format_type,
                    "students_count": test.students.count(),
                    "created_at": test.created_at,
                    "updated_at": test.updated_at,
                    "created_by": test.created_by.id if test.created_by else None,
                    "updated_by": test.updated_by.id if test.updated_by else None,
                    "is_active": test.is_active,
                    "show_skip_button": test.show_skip_button,
                    "show_prev_button": test.show_prev_button,
                })

            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            self.logger.error(f"Error fetching full test list: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'], url_path='course/(?P<course_id>[^/.]+)/subjects/(?P<subject_id>[^/.]+)/topics')
    def get_topics_by_course_subject(self, request, course_id=None, subject_id=None):
        try:
            course_subject = CourseSubjects.objects.get(course_id=course_id, subject_id=subject_id)
            topics = Topic.objects.filter(course_subject=course_subject).values('id', 'name')
            return Response(list(topics))
        except CourseSubjects.DoesNotExist:
            return Response({"error": "Invalid course_id or subject_id"}, status=status.HTTP_404_NOT_FOUND)

    # 🔽 New Action: Get Subtopics for a Topic
    @action(detail=False, methods=['GET'], url_path='topics/(?P<topic_id>[^/.]+)/subtopics')
    def get_subtopics_by_topic(self, request, topic_id=None):
        try:
            subtopics = SubTopic.objects.filter(topic_id=topic_id).values('id', 'name')
            return Response(list(subtopics))
        except Exception:
            return Response({"error": "Invalid topic_id"}, status=status.HTTP_404_NOT_FOUND)    

    @action(detail=False, methods=['GET'], url_path='topics')
    def get_all_topics(self, request):
        try:
            course_id = request.query_params.get("course_id")
            subject_id = request.query_params.get("subject_id")

            topics = Topic.objects.all()

            if course_id and subject_id:
                topics = topics.filter(course_subject__course_id=course_id, course_subject__subject_id=subject_id)

            data = topics.values("id", "name", "course_subject_id")
            return Response(list(data))
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # ✅ Get Subtopics by Course + Subject + Topic
    @action(detail=False, methods=['GET'], url_path='subtopics')
    def get_all_subtopics(self, request):
        try:
            course_id = request.query_params.get("course_id")
            subject_id = request.query_params.get("subject_id")
            topic_id = request.query_params.get("topic_id")

            subtopics = SubTopic.objects.all()

            if course_id and subject_id:
                subtopics = subtopics.filter(topic__course_subject__course_id=course_id,
                                            topic__course_subject__subject_id=subject_id)

            if topic_id:
                subtopics = subtopics.filter(topic_id=topic_id)

            data = subtopics.values("id", "name", "topic_id")
            return Response(list(data))
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'], url_path='topic-scores')
    def topic_scores(self,request):
        student_id = request.query_params.get('student_id')
        date_range = request.query_params.get('date_range', 'last_six_month')
        start_date = None
        end_date = datetime.now()

        # Date range logic
        if date_range == 'last_six_month':
            start_date = end_date - timedelta(days=180)
        elif date_range == 'last_month':
            start_date = end_date - timedelta(days=30)
        elif date_range == 'last_week':
            start_date = end_date - timedelta(days=7)
        elif date_range == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif date_range == 'custom':
            custom_start = request.query_params.get('start_date')
            custom_end = request.query_params.get('end_date')
            if not custom_start or not custom_end:
                return Response({"error": "Custom date range must include start_date and end_date."}, status=400)
            start_date = datetime.strptime(custom_start, '%Y-%m-%d')
            end_date = datetime.strptime(custom_end, '%Y-%m-%d')

        if not student_id:
            return Response({"error": "student_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_model().objects.get(id=student_id)
        except:
            return Response({"error": "Invalid student_id."}, status=status.HTTP_404_NOT_FOUND)

    # Fetch student answers in the date range
        submissions = TestSubmission.objects.filter(student=user, status='COMPLETED')
        results = Result.objects.filter(test_submission__in=submissions, created_at__range=(start_date, end_date))
        answers = QuestionAnswer.objects.filter(result__in=results)

        topic_total = defaultdict(int)
        topic_correct = defaultdict(int)

        for answer in answers:
            topic = answer.question.topic.name if answer.question.topic else "General"
            topic_total[topic] += 1
            if answer.is_correct:
                topic_correct[topic] += 1

        response = []
        for topic in topic_total:
            total = topic_total[topic]
            correct = topic_correct[topic]
            percentage = (correct / total) * 100 if total > 0 else 0
            response.append({
                "area": topic,
                "score": round(percentage, 2)
            })

    # Sort by score descending
        response = sorted(response, key=lambda x: x['score'], reverse=True)

        return Response(response)

    

    @action(
    detail=False,
    methods=['DELETE'],  
    url_path='delete-assignment'
    )
    def delete_test_assignment(self, request):
        test_submission_id = request.query_params.get('test_submission_id')

        if not test_submission_id:
            return Response({"error": "test_submission_id is required"}, status=400)

        try:
            test_submission = TestSubmission.objects.get(id=test_submission_id)
        except TestSubmission.DoesNotExist:
            return Response({"error": "TestSubmission not found"}, status=404)

        # Ensure only deletable status
        if test_submission.status != TestSubmission.YET_TO_START:
            return Response({"error": "Only 'YET_TO_START' submissions can be deleted"}, status=400)

        test_submission.delete()
        return Response({"message": "Test assignment deleted successfully"}, status=200)

    @action(detail=False, methods=["GET"], url_path="test-time-series")
    def test_time_series(self, request):
        student_id = request.query_params.get("student_id")
        course_id = request.query_params.get("course_id")
        subject_id = request.query_params.get("subject_id")
        test_type = request.query_params.get("test_type", "fullLengthTest")
        date_range = request.query_params.get("date_range", "last_six_month")

        if not all([student_id, course_id, subject_id]):
            return Response({"error": "Missing parameters"}, status=400)

        now = timezone.now()
        if date_range == "today":
            start_date = now.replace(hour=0, minute=0, second=0)
        elif date_range == "last_week":
            start_date = now - timedelta(days=7)
        else:
            start_date = now - timedelta(days=30)

        time_series_map = defaultdict(int)

        if test_type == "fullLengthTest":
            queryset = Result.objects.filter(
                test_submission__student_id=student_id,
                test_submission__test__course_id=course_id,
                test_submission__test__section__course_subject__subject_id=subject_id,
                test_submission__completion_date__gte=start_date
            ).values("test_submission__completion_date", "time_taken")

            for entry in queryset:
                date_str = entry["test_submission__completion_date"].strftime("%d %b")
                time_series_map[date_str] += entry["time_taken"]

        else:
            queryset = PracticeTestResult.objects.filter(
                practice_test__student_id=student_id,
                practice_test__course_subject__course_id=course_id,
                practice_test__course_subject__subject_id=subject_id,
                created_at__gte=start_date
            ).values("created_at", "time_taken")

            for entry in queryset:
                date_str = entry["created_at"].strftime("%d %b")
                time_series_map[date_str] += entry["time_taken"]

        # Format into "1.44" style minutes
        response = [
            {
                "date": date,
                "minutes": float(f"{seconds // 60}.{str(seconds % 60).zfill(2)}")
            }
            for date, seconds in sorted(time_series_map.items())
        ]

        return Response(response)



    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent],
    url_path='student-test-scores'
)
    def get_student_test_scores(self, request):
        student_id = request.query_params.get('student_id')
        course_id = request.query_params.get('course_id')
        subject_id = request.query_params.get('subject_id')
        topic_id = request.query_params.get('topic_id')
        subtopic_id = request.query_params.get('subtopic_id')
        date_range = request.query_params.get('date_range', 'last_six_month')

        # -----------------------------
        # Date Range
        # -----------------------------
        end_date = now()
        if date_range == 'last_week':
            start_date = end_date - timedelta(days=7)
        elif date_range == 'last_month':
            start_date = end_date - timedelta(days=30)
        elif date_range == 'last_six_month':
            start_date = end_date - timedelta(days=180)
        elif date_range == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = end_date - timedelta(days=30)

        submissions = TestSubmission.objects.filter(completion_date__range=(start_date, end_date))

        if student_id:
            submissions = submissions.filter(student_id=student_id)
        if course_id:
            submissions = submissions.filter(test__course_id=course_id)

        response_data = []

        # Subject → CourseSubjects
        course_subject_ids_for_filter = None
        if subject_id:
            if course_id:
                cs_qs = CourseSubjects.objects.filter(course_id=course_id, subject_id=subject_id)
            else:
                cs_qs = CourseSubjects.objects.filter(subject_id=subject_id)
            course_subject_ids_for_filter = list(cs_qs.values_list("id", flat=True))

        # -----------------------------
        # MAIN LOOP
        # -----------------------------
        for submission in submissions:
            test = submission.test
            result = getattr(submission, "result", None)
            if not result:
                continue

            all_sections = Section.objects.filter(test=test).order_by("order")

            if course_subject_ids_for_filter:
                subject_course_subject_ids = course_subject_ids_for_filter
            else:
                subject_course_subject_ids = list(all_sections.values_list("course_subject_id", flat=True).distinct())

            total_score = 0
            subjects_out = []

            for cs_id in subject_course_subject_ids:

                course_subject = CourseSubjects.objects.filter(id=cs_id).first()
                if not course_subject:
                    continue

                subject_correct_count = 0
                subject_incorrect_count = 0
                subject_blank_count = 0
                subject_max_score = 0
                subject_min_score = 0
                subject_score = 0

                section_1_score = 0
                section_2_score = 0

                subject_sections = all_sections.filter(course_subject_id=cs_id).order_by("order")

                for section in subject_sections:
                    correct_marks = section.course_subject.correct_answer_marks
                    incorrect_marks = section.course_subject.incorrect_answer_marks
                    section_order = section.order

                    for sub_section in section.sub_sections:

                        # Dynamic or static question list
                        if test.format_type == Test.DYNAMIC:
                            key = f"{cs_id}_{sub_section.get('id')}"
                            question_ids = submission.selected_question_ids.get(
                                key,
                                sub_section.get("questions", [])
                            )
                        else:
                            question_ids = sub_section.get("questions", [])

                        if not isinstance(question_ids, list):
                            question_ids = []

                        # ❗ CRITICAL — SAME AS DETAILS API
                        qas_qs = QuestionAnswer.objects.filter(
                            result=result,
                            course_subject_id=cs_id,
                            section_id=sub_section["id"],   # FIXED
                            question_id__in=question_ids
                        )

                        sub_correct = qas_qs.filter(is_correct=True).count()
                        sub_blank = qas_qs.filter(is_skipped=True).count()
                        sub_incorrect = qas_qs.filter(is_correct=False, is_skipped=False).count()

                        subject_correct_count += sub_correct
                        subject_incorrect_count += sub_incorrect
                        subject_blank_count += sub_blank

                        section_score = (sub_correct * correct_marks) - (sub_incorrect * incorrect_marks)
                        subject_score += section_score

                        if sub_section["id"] == 1:
                            section_1_score += sub_correct
                        else:
                            section_2_score += sub_correct


                # CombinedScore override
                score_record = CombinedScore.objects.filter(
                    section1_correct=section_1_score,
                    section2_correct=section_2_score,
                    subject_name=course_subject.subject.name
                ).first()

                if score_record:
                    subject_min_score = 200
                    subject_max_score = 800
                    subject_score = score_record.total_score

                total_score += subject_score

                subjects_out.append({
                    "name": course_subject.subject.name,
                    "subject_correct_count": subject_correct_count,
                    "subject_incorrect_count": subject_incorrect_count,
                    "subject_blank_count": subject_blank_count,
                    "subject_max_score": subject_max_score,
                    "subject_min_score": subject_min_score,
                    "subject_score": subject_score,
                })

            response_data.append({
                "test_name": test.name,
                "score": total_score,
                "subjects": subjects_out
            })

        return Response(response_data, status=status.HTTP_200_OK)









    @action(detail=False, methods=['GET'], url_path='full-length-scores-export')
    def full_length_scores_export(self, request):
        date_range = request.query_params.get('date_range')
        course_id = request.query_params.get('course_id')  # optional
        custom_start = request.query_params.get('start_date')
        custom_end = request.query_params.get('end_date')

        try:
            end_date = timezone.now()
            start_date = None

            if date_range == 'today':
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif date_range == 'last_week':
                start_date = end_date - timedelta(days=7)
            elif date_range == 'last_month':
                start_date = end_date - timedelta(days=30)
            elif date_range == 'last_six_month':
                start_date = end_date - timedelta(days=180)
            elif date_range == 'custom':
                if not (custom_start and custom_end):
                    return Response({"error": "Custom start and end date required"}, status=400)
                start_date = datetime.strptime(custom_start, "%Y-%m-%d")
                end_date = datetime.strptime(custom_end, "%Y-%m-%d") + timedelta(days=1)

            if not start_date:
                return Response({"error": "Invalid or missing date range"}, status=400)

            test_submissions = TestSubmission.objects.filter(
                status=TestSubmission.COMPLETED,
                test__test_type='EXAM',
                student__is_active=True,
                result__created_at__range=(start_date, end_date)
            ).select_related('student', 'result', 'test')

            if course_id:
                test_submissions = test_submissions.filter(test__course_id=course_id)

            response_data = []

            for submission in test_submissions:
                student = submission.student.name
                test = submission.test
                course = test.course.name
                result = submission.result

                math_raw = {"section1": 0, "section2": 0}
                english_raw = {"section1": 0, "section2": 0}
                math_topics = []
                english_topics = []

                course_subjects = CourseSubjects.objects.filter(course=test.course)

                for course_subject in course_subjects:
                    subject_name = course_subject.subject.name.lower()
                    sections = Section.objects.filter(test=test, course_subject=course_subject)

                    topic_stats = defaultdict(lambda: {"correct": 0, "total": 0})

                    for section in sections:
                        for sub_section in section.sub_sections:
                            question_ids = (
                                submission.selected_question_ids.get(f"{course_subject.id}_{sub_section['id']}", [])
                                if test.format_type == Test.DYNAMIC
                                else sub_section['questions']
                            )

                            qas = result.question_answers.select_related('question').filter(
                                course_subject=course_subject,
                                section_id=sub_section['id'],
                                question_id__in=question_ids,
                            )

                            for qa in qas:
                                topic_name = qa.question.topic.name if qa.question and qa.question.topic else "Unknown"
                                topic_stats[topic_name]["total"] += 1
                                if qa.is_correct:
                                    topic_stats[topic_name]["correct"] += 1

                            # SAT only scoring logic
                            if course == "SAT":
                                correct_count = qas.filter(is_correct=True).count()
                                if subject_name == "math":
                                    if sub_section['id'] == 1:
                                        math_raw["section1"] += correct_count
                                    else:
                                        math_raw["section2"] += correct_count
                                elif subject_name == "english":
                                    if sub_section['id'] == 1:
                                        english_raw["section1"] += correct_count
                                    else:
                                        english_raw["section2"] += correct_count

                    # Append topics with score counts
                    for topic, stats in topic_stats.items():
                        row = {
                            "topic": topic,
                            "score": f"{stats['correct']}/{stats['total']}"
                        }
                        if subject_name == "math":
                            math_topics.append(row)
                        elif subject_name == "english":
                            english_topics.append(row)

                # Convert raw counts to SAT scores
                math_score = english_score = 200
                if course == "SAT":
                    try:
                        math_score = CombinedScore.objects.get(
                            section1_correct=math_raw["section1"],
                            section2_correct=math_raw["section2"],
                            subject_name="Math"
                        ).total_score
                    except CombinedScore.DoesNotExist:
                        math_score = 200

                    try:
                        english_score = CombinedScore.objects.get(
                            section1_correct=english_raw["section1"],
                            section2_correct=english_raw["section2"],
                            subject_name="English"
                        ).total_score
                    except CombinedScore.DoesNotExist:
                        english_score = 200

                response_data.append({
                    "student": student,
                    "test_name": test.name,
                    "course": course,
                    "math_score": math_score,
                    "english_score": english_score,
                    "math_topics": math_topics,
                    "english_topics": english_topics,
                })

            return Response(response_data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)



    @action(detail=False, methods=['GET'], url_path='full-length-scores')
    def full_length_scores(self, request):
        course_id = request.query_params.get('course_id')
        subject_id = request.query_params.get('subject_id')
        topic_id = request.query_params.get('topic_id')
        subtopic_id = request.query_params.get('subtopic_id')
        date_range = request.query_params.get('date_range')

        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            test_submissions = TestSubmission.objects.filter(
                test__course_id=course_id,
                status=TestSubmission.COMPLETED,
                test__test_type='EXAM',
                student__is_active=True
            ).select_related('student', 'result', 'test')

        # Date filtering
            end_date = timezone.now()
            start_date = None

            if date_range == 'today':
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif date_range == 'last_week':
                start_date = end_date - timedelta(days=7)
            elif date_range == 'last_month':
                start_date = end_date - timedelta(days=30)
            elif date_range == 'last_six_month':
                start_date = end_date - timedelta(days=180)
            elif date_range == 'custom':
                try:
                    custom_start = request.query_params.get('start_date')
                    custom_end = request.query_params.get('end_date')
                    if not (custom_start and custom_end):
                        raise ValueError("Custom dates not provided")

                    start_date = datetime.strptime(custom_start, '%Y-%m-%d')
                    end_date = datetime.strptime(custom_end, '%Y-%m-%d') + timedelta(days=1)
                except Exception:
                    return Response({"error": "Invalid custom date format. Use YYYY-MM-DD"}, status=400)

            if start_date:
                test_submissions = test_submissions.filter(result__created_at__range=(start_date, end_date))

            student_score_totals = defaultdict(int)
            student_test_counts = defaultdict(int)

        # If subject_id is provided, calculate for that subject only
            if subject_id:
                course_subject = CourseSubjects.objects.get(course_id=course_id, subject_id=subject_id)
                correct_mark = course_subject.correct_answer_marks
                incorrect_mark = course_subject.incorrect_answer_marks
                subject_ids = [course_subject]
            else:
                subject_ids = CourseSubjects.objects.filter(course_id=course_id)
                correct_mark = 1
                incorrect_mark = 1

            for submission in test_submissions:
                result = getattr(submission, 'result', None)
                print("result",result)
                if not result:
                    continue

                test = submission.test
                course_name = test.course.name

                for course_subject in subject_ids:
                    
                    if subject_id and course_subject.subject_id != int(subject_id):
                        
                        continue
                    
                    if course_name == 'SAT':
                        section_1_score = 0
                        section_2_score = 0

                        sections = Section.objects.filter(test=test, course_subject=course_subject)
                        for section in sections:
                            for sub_section in section.sub_sections:
                                question_ids = (
                                    submission.selected_question_ids.get(f"{course_subject.id}_{sub_section['id']}", [])
                                    if test.format_type == Test.DYNAMIC else
                                    sub_section['questions']
                                )

                                qas = result.question_answers.select_related('question').filter(
                                    course_subject=course_subject,
                                    section_id=sub_section['id'],
                                    question_id__in=question_ids,
                                    is_skipped=False
                                )

                                if topic_id:
                                    qas = qas.filter(question__topic_id=int(topic_id))
                                if subtopic_id:
                                    qas = qas.filter(question__sub_topic_id=int(subtopic_id))

                                correct_count = qas.filter(is_correct=True).count()
                                if sub_section['id'] == 1:
                                    section_1_score = correct_count
                                    print("section_1_score",section_1_score)
                                else:
                                    section_2_score = correct_count
                                    print("section_2_score",section_2_score)

                        try:
                            score_record = CombinedScore.objects.get(
                                section1_correct=section_1_score,
                                section2_correct=section_2_score,
                                subject_name=course_subject.subject.name
                            )
                            score = score_record.total_score
                        except CombinedScore.DoesNotExist:
                            score = 200
                    else:
                        answers = result.question_answers.select_related('question').filter(course_subject=course_subject)
                        print("answers",answers)
                        if topic_id:
                            answers = answers.filter(question__topic_id=topic_id)
                        if subtopic_id:
                            answers = answers.filter(question__sub_topic_id=subtopic_id)
                        print("Filtered answers count:", answers.count())
                        print("Topics present:", answers.values_list('question__topic_id', flat=True).distinct())
                        print("Subtopics present:", answers.values_list('question__sub_topic_id', flat=True).distinct())    

                        correct_count = answers.filter(is_correct=True, is_skipped=False).count()
                        incorrect_count = answers.filter(is_correct=False, is_skipped=False).count()

                        score = (correct_count * course_subject.correct_answer_marks) - (
                            incorrect_count * course_subject.incorrect_answer_marks)

                    student_score_totals[submission.student.name] += score
                    print("submission.student.name",submission.student.name)
                    student_test_counts[submission.student.name] += 1

           
            response_data = []
            for student, total_score in student_score_totals.items():
                test_count = student_test_counts[student]
                new_test = round(test_count/2)  
                print("test_count",test_count)
                print("total_score",total_score)
                if subject_id:
                    average_score = round(total_score / test_count, 2) if test_count > 0 else 0
                else:
                    average_score = round(total_score / new_test, 2) if test_count > 0 else 0
                
                response_data.append({
                    "student": student,
                    "total_score": average_score,
                    "test_count": test_count
                })

            return Response(response_data)


        except CourseSubjects.DoesNotExist:
            return Response({"error": "Invalid subject_id for given course_id"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)





    @action(detail=False, methods=['GET'], permission_classes=[IsStudent], url_path='time-spent-per-day')
    def get_time_spent_per_day(self, request):
        user = request.user
        today = timezone.now().date()

        date_range = request.query_params.get('date_range', 'last_six_month')  # Default to 'last_month'
        if date_range == 'today':
            start_date = today
        elif date_range == 'last_week':
            start_date = today - timedelta(days=7)
        elif date_range == 'last_month':
            start_date = today - timedelta(days=30)
        elif date_range == 'last_six_month':
            start_date = today - timedelta(days=180)
        else:
    # Default fallback
            start_date = today - timedelta(days=30)


        tab = request.query_params.get('tab', 'fullLengthTest')  # 'fullLengthTest' or 'practiceTest'
        course_id = request.query_params.get('course', None)

        time_map = defaultdict(int)

        if tab == 'fullLengthTest':
            results = Result.objects.filter(
                test_submission__student=user,
                created_at__date__range=(start_date, today)
            )

            if course_id:
                results = results.filter(test_submission__test__course_id=course_id)

            results = results.annotate(day=TruncDate('created_at')).values('day').annotate(total_time=Sum('time_taken'))

            for item in results:
                time_map[item['day']] += item['total_time']

        elif tab == 'practiceTest':
            results = PracticeTestResult.objects.filter(
                practice_test__student=user,
                created_at__date__range=(start_date, today)
            )

            if course_id:
                results = results.filter(practice_test__course_subject__course_id=course_id)

            results = results.annotate(day=TruncDate('created_at')).values('day').annotate(total_time=Sum('time_taken'))

            for item in results:
                time_map[item['day']] += item['total_time']

    # Build response - only for dates with actual data
        response = [
            {
                "date": date.strftime("%d %b"),
                "minutes": float(f"{seconds // 60}.{str(seconds % 60).zfill(2)}"),  # Gives 1.44
            }
            for date, seconds in sorted(time_map.items())
        ]

        return Response(response)

    

    @action(detail=False, methods=['GET'], permission_classes=[AllowAny], url_path='key-strengths')
    def get_key_strengths(self, request):
        from user_manager.models import User
        from test_manager.models import TestSubmission, Result, QuestionAnswer
        from datetime import datetime, timedelta
        from collections import defaultdict

        course_id = request.query_params.get('course_id')
        student_id = request.query_params.get('student_id')
        test_id = request.query_params.get('test_id')  # ✅ new param
        date_range = request.query_params.get('date_range', 'last_six_month')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not course_id or student_id is None:
            return Response({"error": "Both course_id and student_id are required"}, status=400)

        try:
            course_id = int(course_id)
        except ValueError:
            return Response({"error": "Invalid course_id"}, status=400)

        # 🧑‍🎓 Handle student(s)
        if student_id == "":
            students = User.objects.filter(role_id=5)  # All students
        else:
            try:
                student = User.objects.get(id=student_id, role_id=5)
                students = [student]
            except User.DoesNotExist:
                return Response({"error": "Invalid student_id"}, status=400)

        # 📅 Date filtering
        today = datetime.today()
        try:
            if start_date_str and end_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)
            else:
                if date_range == 'today':
                    start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = today + timedelta(days=1)
                elif date_range == 'last_week':
                    start_date = today - timedelta(days=7)
                    end_date = today + timedelta(days=1)
                elif date_range == 'last_month':
                    start_date = today - timedelta(days=30)
                    end_date = today + timedelta(days=1)
                elif date_range == 'last_six_month':
                    start_date = today - timedelta(days=180)
                    end_date = today + timedelta(days=1)
                else:
                    start_date = today - timedelta(days=30)
                    end_date = today + timedelta(days=1)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        # Data containers
        topic_correct = defaultdict(int)
        topic_total = defaultdict(int)
        topic_section = {}
        section_correct = defaultdict(int)
        section_total = defaultdict(int)

        # Filter by course, student(s), and optionally test
        test_submissions = TestSubmission.objects.filter(
            student__in=students,
            status=TestSubmission.COMPLETED,
            test__course_id=course_id,
            completion_date__gte=start_date,
            completion_date__lt=end_date
        )

        if test_id:  # ✅ filter by test_id
            test_submissions = test_submissions.filter(test_id=test_id)

        results = Result.objects.filter(test_submission__in=test_submissions)
        question_answers = QuestionAnswer.objects.filter(result__in=results)

        for ans in question_answers:
            topic = ans.question.topic
            subject = ans.question.course_subject.subject.name if ans.question.course_subject and ans.question.course_subject.subject else "General"

            if topic:
                topic_name = topic.name
                section = "Math" if "Math" in subject else "English" if "English" in subject else "General"

                topic_section[topic_name] = section
                topic_total[topic_name] += 1
                if ans.is_correct:
                    topic_correct[topic_name] += 1

                section_total[section] += 1
                if ans.is_correct:
                    section_correct[section] += 1

        topic_data = defaultdict(list)
        for topic, total in topic_total.items():
            correct = topic_correct[topic]
            score = round((correct / total) * 100, 2) if total > 0 else 0
            section = topic_section.get(topic, "General")
            topic_data[section].append({"topic": topic, "score": score})

        section_data = []
        for section, total in section_total.items():
            correct = section_correct[section]
            score = round((correct / total) * 100, 2) if total > 0 else 0
            section_data.append({"section": section, "score": score})

        return Response({
            "sections": section_data,
            "topics": topic_data
        })






    


    @action(detail=False, methods=['GET'], permission_classes=[AllowAny], url_path='full_length_scores')
    def get_full_length_scores(self, request):
        parent_id = request.query_params.get('parent_id')

        if not parent_id:
            return Response({"error": "Missing parent_id"}, status=400)

    # 🔍 Find parent
        try:
            parent = User.objects.get(id=parent_id)
        except User.DoesNotExist:
            return Response({"error": "Invalid parent_id"}, status=404)

    # 👶 Get all student IDs linked to this parent
        student_ids = StudentMetadata.objects.filter(
            Q(father=parent) | Q(mother=parent)
        ).values_list('student_id', flat=True)

        # 🔎 Filter completed full-length test submissions for these students
        test_submissions = TestSubmission.objects.filter(
            student_id__in=student_ids,
            status=TestSubmission.COMPLETED,
            test__test_type=Test.EXAM  # 🧠 full-length
        ).select_related('test', 'result')

        results = []
        for submission in test_submissions:
            result = getattr(submission, 'result', None)
            if not result:
                continue

            total_questions = result.correct_answer_count + result.incorrect_answer_count
            if total_questions == 0:
                continue

            percentage = (result.correct_answer_count / total_questions) * 100

            results.append({
                "test_name": submission.test.name,
                "score": round(percentage, 2)
            })

        return Response(results, status=200)


    @action(detail=False, methods=['GET'], permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent], url_path='parentid_to_studentid')
    def parentid_to_studentid(self, request):
        parent_id = request.query_params.get('parent_id')

        if not parent_id:
            return Response({"error": "Missing parent_id"}, status=400)

        try:
            parent = User.objects.get(id=parent_id)
        except User.DoesNotExist:
            return Response({"error": "Invalid parent_id"}, status=404)

        # Step 1: Get all children of this parent
        student_ids = StudentMetadata.objects.filter(Q(father=parent) | Q(mother=parent)).values_list('student', flat=True)
        return Response({"studentid":student_ids }, status=200)

  

    @action(
        detail=False,
        methods=['GET'],
        permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent],
        url_path='Parent_course_wise_time'
    )
    def Parent_course_wise_time(self, request):
        parent_id = request.query_params.get('parent_id')
        course_id = request.query_params.get('course_id')
        subject_id = request.query_params.get('subject_id')
        date_range = request.query_params.get('date_range')  # <== NEW

        if not parent_id:
            return Response({"error": "Missing parent_id"}, status=400)

        try:
            parent = User.objects.get(id=parent_id)
        except User.DoesNotExist:
            return Response({"error": "Invalid parent_id"}, status=404)

        student_ids = StudentMetadata.objects.filter(
            Q(father=parent) | Q(mother=parent)
        ).values_list('student', flat=True)

        course_time_map = defaultdict(int)

        now = timezone.now()
        if date_range == "last_week":
            start_date = now - timedelta(days=7)
        elif date_range == "last_six_month":
            start_date = now - timedelta(days=180)
        elif date_range == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        else:  # Default: last_month
            start_date = now - timedelta(days=30)

    # === Full Length Tests ===
        full_results = Result.objects.filter(
            test_submission__student_id__in=student_ids,
            test_submission__completion_date__gte=start_date
        ).select_related('test_submission__test__course')

        if course_id:
            full_results = full_results.filter(test_submission__test__course_id=course_id)

        for result in full_results:
            course = result.test_submission.test.course
            course_time_map[course.name] += result.time_taken

    # === Practice Tests ===
        practice_results = PracticeTestResult.objects.filter(
            practice_test__student_id__in=student_ids,
            practice_test__created_at__gte=start_date
        ).select_related('practice_test__course_subject__course', 'practice_test__course_subject__subject')

        if course_id:
            practice_results = practice_results.filter(practice_test__course_subject__course_id=course_id)
        if subject_id:
            practice_results = practice_results.filter(practice_test__course_subject__subject_id=subject_id)

        for result in practice_results:
            course = result.practice_test.course_subject.course
            course_time_map[course.name] += result.time_taken

        response = [
            {
                "course": course_name,
                "time_spent_hours": round(total_time / 360, 2)
            }
            for course_name, total_time in sorted(course_time_map.items(), key=lambda x: x[1], reverse=True)
        ]

        return Response(response)


    @action(detail=False, methods=['get'], url_path='course-wise-time')
    def get_course_wise_time(self, request):
        student_id = request.query_params.get("student_id")
        user_ids_param = request.query_params.get("user_ids")
        course_id = request.query_params.get("course_id")
        test_id = request.query_params.get("test_id")
        date_range = request.query_params.get("date_range", "last_six_month")
        start_date_param = request.query_params.get("start_date")
        end_date_param = request.query_params.get("end_date")
        subject_id = request.query_params.get("subject_id")
        topic_id = request.query_params.get("topic_id")
        subtopic_id = request.query_params.get("subtopic_id")

        # Determine student/user list
        if user_ids_param:
            user_ids = [int(uid.strip()) for uid in user_ids_param.split(',') if uid.strip()]
        elif student_id is not None:
            student_id = student_id.strip()
            if student_id:
                user_ids = [int(student_id)]
            else:
                # all students
                user_ids = list(User.objects.values_list('id', flat=True))
        else:
            return Response({"detail": "student_id or user_ids is required."}, status=400)

        # Date Range
        today = now().date()
        if date_range == "today":
            start_date = make_aware(datetime.combine(today, datetime.min.time()))
            end_date = make_aware(datetime.combine(today, datetime.max.time()))
        elif date_range == "last_week":
            start_date = make_aware(datetime.combine(today - timedelta(days=7), datetime.min.time()))
            end_date = make_aware(datetime.combine(today, datetime.max.time()))
        elif date_range == "last_month":
            start_date = make_aware(datetime.combine(today - timedelta(days=30), datetime.min.time()))
            end_date = make_aware(datetime.combine(today, datetime.max.time()))
        elif date_range == "last_six_month":
            start_date = make_aware(datetime.combine(today - timedelta(days=180), datetime.min.time()))
            end_date = make_aware(datetime.combine(today, datetime.max.time()))
        elif date_range == "custom" and start_date_param and end_date_param:
            try:
                start_date = make_aware(datetime.strptime(start_date_param, "%Y-%m-%d"))
                end_date = make_aware(
                    datetime.strptime(end_date_param, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
                )
            except ValueError:
                return Response({"detail": "Invalid custom date format. Use YYYY-MM-DD."}, status=400)
        else:
            start_date = make_aware(datetime.combine(today - timedelta(days=30), datetime.min.time()))
            end_date = make_aware(datetime.combine(today, datetime.max.time()))

        # Query Results
        results = Result.objects.select_related(
            'test_submission__test',
            'test_submission__student'
        ).filter(
            test_submission__completion_date__isnull=False,
            test_submission__completion_date__range=(start_date, end_date),
            test_submission__test__test_type=Test.EXAM,
            test_submission__student_id__in=user_ids
        )

        if course_id:
            results = results.filter(test_submission__test__course_id=course_id)

        if test_id:
            results = results.filter(test_submission__test_id=test_id)

        # ----------------------
        # Build raw response list
        # ----------------------
        response = []

        for res in results:
            test = res.test_submission.test
            test_name = test.name

            # time in minutes.xx
            time_minutes = float(f"{res.time_taken // 60}.{str(res.time_taken % 60).zfill(2)}")

            question_answers = res.question_answers.all()

            # optional filters
            if subject_id:
                question_answers = question_answers.filter(course_subject__subject_id=subject_id)
            if topic_id:
                question_answers = question_answers.filter(question__topic_id=topic_id)
            if subtopic_id:
                question_answers = question_answers.filter(question__sub_topic_id=subtopic_id)

            # -------------------------------------------------
            # ✅ Use SAME COMBINEDSCORE LOGIC as in get_details
            # -------------------------------------------------
            english_score = 0
            math_score = 0

            # --- ENGLISH ---
            eng_qs = question_answers.filter(course_subject__subject__name__icontains='English')
            if eng_qs.exists():
                # section 1 & 2 correct counts for English
                eng_section_1_score = eng_qs.filter(section_id=1, is_correct=True).count()
                eng_section_2_score = eng_qs.filter(section_id=2, is_correct=True).count()

                # get subject_name exactly like in details API
                eng_course_subject = eng_qs.first().course_subject
                eng_subject_name = eng_course_subject.subject.name if eng_course_subject and eng_course_subject.subject else "English"

                eng_score_record = CombinedScore.objects.filter(
                    section1_correct=eng_section_1_score,
                    section2_correct=eng_section_2_score,
                    subject_name=eng_subject_name
                ).first()

                if eng_score_record:
                    english_score = eng_score_record.total_score
                else:
                    # default 200 if not found (like your logic)
                    english_score = 200

            # --- MATH ---
            math_qs = question_answers.filter(course_subject__subject__name__icontains='Math')
            if math_qs.exists():
                math_section_1_score = math_qs.filter(section_id=1, is_correct=True).count()
                math_section_2_score = math_qs.filter(section_id=2, is_correct=True).count()

                math_course_subject = math_qs.first().course_subject
                math_subject_name = math_course_subject.subject.name if math_course_subject and math_course_subject.subject else "Math"

                math_score_record = CombinedScore.objects.filter(
                    section1_correct=math_section_1_score,
                    section2_correct=math_section_2_score,
                    subject_name=math_subject_name
                ).first()

                if math_score_record:
                    math_score = math_score_record.total_score
                else:
                    math_score = 200

            # total_score: either subject-specific or combined
            if subject_id:
                # if subject filter applied, return only that subject's score
                subject = Subject.objects.filter(id=subject_id).first()
                if subject:
                    sname = subject.name.lower()
                    if 'math' in sname:
                        total_score = math_score
                    elif 'english' in sname:
                        total_score = english_score
                    else:
                        total_score = 0
                else:
                    total_score = 0
            else:
                total_score = english_score + math_score

            response.append({
                "test_name": test_name,
                "english_score": english_score,
                "math_score": math_score,
                "score": total_score,
                "time_taken_minutes": time_minutes
            })

        # ----------------------------------------
        # 🔥 GROUP BY TEST NAME & AVERAGE VALUES
        # ----------------------------------------
        grouped = defaultdict(list)
        for item in response:
            grouped[item["test_name"]].append(item)

        final_output = []

        for test_name, items in grouped.items():
            count = len(items)

            avg_english = sum(x["english_score"] for x in items) / count if count else 0
            avg_math = sum(x["math_score"] for x in items) / count if count else 0
            avg_total = sum(x["score"] for x in items) / count if count else 0
            avg_time = sum(x["time_taken_minutes"] for x in items) / count if count else 0

            final_output.append({
                "test_name": test_name,
                "english_score": round(avg_english, 2),
                "math_score": round(avg_math, 2),
                "score": round(avg_total, 2),
                "time_taken_minutes": round(avg_time, 2)
            })

        return Response(final_output, status=200)





    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent], url_path='test-wise-scores')
    def get_test_wise_scores(self, request):
        student_id = request.query_params.get('student_id')
        course_id = request.query_params.get('course_id')

        submissions = TestSubmission.objects.filter(status=TestSubmission.COMPLETED)

        if student_id and student_id != 'All':
            student = get_object_or_404(User, id=student_id, role_id=5)
            submissions = submissions.filter(student=student)

        if course_id and course_id != 'All':
            submissions = submissions.filter(test__course_id=course_id)

        results = Result.objects.filter(test_submission__in=submissions).select_related('test_submission__test')

        test_scores = []
        for result in results:
            test = result.test_submission.test
            total_questions = result.correct_answer_count + result.incorrect_answer_count
            percentage = (result.correct_answer_count / total_questions) * 100 if total_questions > 0 else 0

            test_scores.append({
                "test_name": test.name,
                "score": round(percentage, 2)
            })

        return Response(test_scores, status=status.HTTP_200_OK)
    


    @permission_classes([IsAdmin])
    def create(self, request, *args, **kwargs):
        data = request.data
        data['created_by'] = request.user.id
        data['updated_by'] = request.user.id
        data['test_type'] = Test.EXAM
        serializer = TestSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            test_data = serializer.validated_data
            if test_data['format_type'] == Test.DYNAMIC:
                course_subjects = CourseSubjects.get_subjects_for_course(test_data['course'])
                for course_subject in course_subjects:
                    total_questions_required = calculate_total_questions_required(course_subject)
                    available_questions_count = Question.objects.filter(course_subject=course_subject).count()

                    if available_questions_count < total_questions_required:
                        return get_error_response(
                            f'Insufficient questions for dynamic test format. Required: {total_questions_required}, Available: {available_questions_count} for subject- {course_subject.subject.name}')

            # Create test if enough questions are available
            test = serializer.save()
            return Response(TestSerializer(test).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)


            

    @permission_classes([IsAdminOrMentorOrFacultyOrStudentOrParent])
    def list(self, request):
        user = request.user
        serializer_class = TestListSerializer
        queryset = None
        filterset = None

        student_id = request.GET.get("student_id")

        # Case: Student or Parent
        if user.role.name == 'student':
            queryset = TestSubmission.objects.filter(student=user).order_by('-assigned_date')
            serializer_class = TestSubmissionSerializer
            filterset = TestSubmissionFilter(data=request.GET, queryset=queryset, request=request)


        elif user.role.name == 'parent':
            sm = StudentMetadata.objects.filter(Q(father=user) | Q(mother=user))
            queryset = TestSubmission.objects.filter(student__in=sm.values_list('student', flat=True))
            serializer_class = TestSubmissionSerializer
            filterset = TestSubmissionFilter(data=request.GET, queryset=queryset, request=request)


        # Case: Admin, Faculty, Mentor
        elif user.role.name in ['admin', 'faculty', 'mentor']:
            if student_id:
                # Filter by specific student if student_id is passed
                queryset = TestSubmission.objects.filter(student_id=student_id).order_by('-assigned_date')
                serializer_class = TestSubmissionSerializer
                filterset = TestSubmissionFilter(data=request.GET, queryset=queryset, request=request)

            else:
                # Otherwise, return all available tests
                queryset = Test.get_all()
                serializer_class = TestListSerializer
                filterset = TestFilter(data=request.GET, queryset=queryset, request=request)


        else:
            return get_error_response("Access denied")

        if not filterset.is_valid():
            return get_error_response("Invalid filter parameters")

        filtered_tests = filterset.qs

        # Apply pagination
        paginator = CustomPageNumberPagination()
        paginated_objects = paginator.paginate_queryset(filtered_tests, request)

        serializer = serializer_class(paginated_objects, many=True, context={'user': user})
        return paginator.get_paginated_response(serializer.data)


    @permission_classes([IsAdminOrMentorOrFacultyOrStudentOrParent])
    def retrieve(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        serializer = TestSerializer(test)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @permission_classes([IsAdmin])
    def destroy(self, request, pk=None, *args, **kwargs):
        instance = Test.get_test_by_id(test_id=pk)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        # instance.is_active = False
        # instance.updated_at = timezone.now()
        # instance.save()
        instance.delete()

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin], url_path='deactivate')
    def deactivate_test(self, request, pk=None):
        test = Test.get_test_by_id(test_id=pk)
        # test.is_active = False
        # test.updated_at = timezone.now()
        # test.save()
        test.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['POST'], permission_classes=[IsAdmin], url_path='add-questions')
    def add_questions_to_test_section(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        course_subject = request.data.get('course_subject_id')
        section_id = request.data.get('section_id')
        question_ids = request.data.get('question_ids', [])

        # Validate that the provided question IDs exist
        if not Question.get_questions_for_ids_for_test(ids=question_ids,
                                                       test_type=Question.FULL_LENGTH_TEST_TYPE).count() == len(
            question_ids):
            return get_error_response(message='One or more questions do not exist.')

        section = Section.fetch_section_using_test_course_subject(test=test, course_subject=course_subject)
        if not section:
            return get_error_response(message='Invalid course or subject provided')

        for sub_section in section.sub_sections:
            if sub_section["id"] == section_id:
                # Check that the number of questions matches "no_of_questions" field
                if len(question_ids) != sub_section["no_of_questions"]:
                    return get_error_response(
                        message=f"Expected exactly {sub_section['no_of_questions']} questions, but {len(question_ids)} were provided.")

                sub_section["questions"] = question_ids
                # sub_section["questions"].extend(question_ids)  # Add the question IDs
                # sub_section["questions"] = list(set(sub_section["questions"]))  # Ensure no duplicates
                section.save()
                break

        return Response({"detail": "Questions added successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['GET'], permission_classes=[IsAdminOrMentorOrFaculty], url_path='assigned-students')
    def get_assigned_students(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        user = request.user
        if user.role.name == 'admin':
            test_submissions = TestSubmission.get_students_assigned_to_test(test=test)
        elif user.role.name == 'faculty':
                # StudentMetadata uses a ManyToMany (or plural field) named `faculties`
                sm = StudentMetadata.objects.filter(faculties=user)
                student_ids = sm.values_list('student', flat=True).distinct()
                test_submissions = TestSubmission.get_students_assigned_to_test_for_faculty(
                    test=test,
                    student_ids=student_ids
                )
        elif user.role.name == 'mentor':
            sm = StudentMetadata.objects.filter(mentor=user)
            student_ids = sm.values_list('student', flat=True).distinct()
            test_submissions = TestSubmission.get_students_assigned_to_test_for_faculty(
                test=test,
                student_ids=student_ids
            )

        else:
            test_submissions = []

        # Apply pagination
        paginator = CustomPageNumberPagination()
        paginator.page_size = 15
        paginated_tests = paginator.paginate_queryset(test_submissions, request)

        serializer = ExistingStudentListSerializer(paginated_tests, many=True)

        # Return the paginated response
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=['GET'], permission_classes=[IsAdmin], url_path='eligible-students')
    def get_eligible_students(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        course = test.course

        # Get all students who already have a submission for this test (any status)
        already_assigned_students = TestSubmission.objects.filter(
            test=test
        ).values_list('student_id', flat=True)

        # Start with all students in the course and exclude already assigned
        query = Q(course_enrollments__course=course, is_active=True) & ~Q(id__in=already_assigned_students)

        # Apply filters from query params
        name = request.query_params.get('name')
        email = request.query_params.get('email')

        if name:
            query &= Q(name__icontains=name)
        if email:
            query &= Q(email__icontains=email)

        students = User.objects.filter(query)

        paginator = CustomPageNumberPagination()
        paginator.page_size = 15
        paginated_students = paginator.paginate_queryset(students, request)

        serializer = EligibleStudentSerializer(paginated_students, many=True, context={'request': request})

        return paginator.get_paginated_response(serializer.data)



    @action(detail=True, methods=['POST'], permission_classes=[IsAdmin], url_path='students')
    @transaction.atomic
    def add_students_to_test(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        student_ids = request.data.get('student_ids', [])

        # Validate that the provided student IDs exist and are actually students
        if not (User.filter_users_using_id_and_role(
                user_ids=student_ids,
                role=Role.get_role_using_name('student').id
        ).count() == len(student_ids)):
            return get_error_response(message='One or more student IDs are invalid.')

        # Add students to the test
        test.students.add(*student_ids)

        # Create TestSubmission entry for each student
        assigned_date = timezone.now()
        expiration_date = assigned_date + timedelta(hours=48)

        submissions = []
        for student_id in student_ids:
            test_submission = TestSubmission.objects.create(
                test=test,
                student_id=student_id,
                assigned_date=assigned_date,
                expiration_date=expiration_date
            )
            submissions.append(test_submission)

            # Send notification
            student = User.get_user_by_id(student_id)
            notification_params = {NotificationTemplate.USER_NAME: student.name,
                                   NotificationTemplate.TEST_NAME: test.name,
                                   NotificationTemplate.REFERENCE_ID: test_submission.id}

            send_notification.delay(notification_name=Notification.TEST_ASSIGNED_NOTIFICATION,
                                    params=notification_params,
                                    user_id=student.id)

        # TestSubmission.objects.bulk_create(submissions)

        return Response(data={"detail": "Students added successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['POST'], url_path='take-test')
    def take_test(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.data.get('test_submission_id')

        existing_submission = TestSubmission.objects.get(id=test_submission_id)

        # Check if the expiration date has already passed
        if existing_submission.status == TestSubmission.EXPIRED:
            return get_error_response(message='Test has expired. Please contact the Admin to reassign the Test.')

        # Extract and validate data
        course_subject = request.data.get('course_subject')
        section_id = request.data.get('section_id')
        question_id, answer_data = list(request.data.get('answer', {}).items())[0]
        is_skipped = request.data.get('is_skipped', False)
        time_taken = request.data.get('time_taken', 0)
        is_marked_for_review = request.data.get('is_marked_for_review', False)

        result, _ = Result.objects.get_or_create(test_submission=existing_submission,
                                                 defaults={"correct_answer_count": 0,
                                                           "incorrect_answer_count": 0,
                                                           "time_taken": 0,
                                                           "detailed_view": {}})

        try:
            question = Question.get_question_by_id(question_id=question_id)
            is_correct = None
            if is_skipped:
                is_correct = False  # Mark skipped questions as incorrect
            elif question.question_type == Question.FILL_IN_BLANKS:
                correct_answers_lower = [ans.lower() for ans in question.options]
                user_answers_lower = [ans.lower() for ans in answer_data]
                is_correct = correct_answers_lower == user_answers_lower

            elif question.question_type == Question.GRIDIN:
                answer_data = answer_data[0]
                if question.question_subtype in [Question.GRIDIN_SINGLE_ANSWER, Question.GRIDIN_MULTI_ANSWER]:
                    is_correct = Question.compare_answers(answer_data, question.options)
                else:
                    is_correct = evaluate_expression(question.options, answer_data)
            else:
                correct_options = [index for index, option in enumerate(question.options) if option['is_correct']]
                if not is_skipped:
                    is_correct = set(answer_data) == set(correct_options)

            # Update Result
            result.update_question_answer_and_stats(test=test, course_subject=course_subject, section_id=section_id,
                                                    question=question, answer_data=answer_data,
                                                    time_taken=time_taken, correct_answer=is_correct,
                                                    is_skipped=is_skipped,
                                                    is_marked_for_review=is_marked_for_review)

        except Question.DoesNotExist:
            return get_error_response(message=f'Question with ID {question_id} does not exist.')

        response = {
            'correct_answer_count': result.correct_answer_count,
            'incorrect_answer_count': result.incorrect_answer_count,
            'time_taken': result.time_taken
        }

        return Response(data=response, status=status.HTTP_200_OK)

    @action(detail=True, methods=['POST'], url_path='skip-section')
    def skip_section(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.data.get('test_submission_id')
        section_id = request.data.get('section_id')
        course_subject_id = request.data.get('course_subject_id')

        test_submission = TestSubmission.objects.get(id=test_submission_id)

        if not test_submission:
            return get_error_response(message='Test submission not found.')

        if test.format_type == Test.DYNAMIC:
            section_key = f'{course_subject_id}_{section_id}'
            question_ids = test_submission.selected_question_ids.get(section_key, [])
        else:  # For LINEAR test type
            # Find the section using section name and course subject
            section = Section.fetch_section_using_test_course_subject(test=test_submission.test,
                                                                      course_subject=course_subject_id)
            if not section:
                return get_error_response(message='Section not found.')

            # Fetch all questions from the section
            sub_section = next((sec for sec in section.sub_sections if str(sec.get("id")) == str(section_id)), None)

            if sub_section is None:
                return get_error_response(message='Sub-section not found.')
            question_ids = sub_section["questions"]

        # Fetch the Result for the given TestSubmission
        result, _ = Result.objects.get_or_create(
            test_submission=test_submission,
            defaults={"correct_answer_count": 0, "incorrect_answer_count": 0, "time_taken": 0, "detailed_view": {}}
        )

        questions = Question.objects.filter(id__in=question_ids).all()

        # Iterate over questions, if it's not answered yet, mark it as skipped
        for question in questions:
            # Create the QuestionAnswer entry to mark it as skipped only if it doesn't already exist
            QuestionAnswer.objects.get_or_create(
                result=result,
                course_subject_id=course_subject_id,
                section_id=section_id,
                question=question,
                defaults={
                    'is_correct': False,
                    'is_skipped': True,
                    'time_taken': 0,
                    'selected_options': [],
                    'times_visited': 1,
                    'first_time_taken': 0,
                    'is_marked_for_review': False
                }
            )

        # Update the incorrect answer count based on skipped questions
        result.incorrect_answer_count = QuestionAnswer.objects.filter(result=result, is_correct=False).count()

        # Update SectionStats for this section
        section_stats, _ = SectionStats.objects.get_or_create(
            result=result,
            course_subject_id=course_subject_id,
            section_id=section_id,
            defaults={'time_taken': 0, 'total_questions': len(question_ids)}
        )

        # Ensure total_questions is correctly set
        section_stats.total_questions = len(question_ids)
        section_stats.save()

        # Check if the test is completed
        all_answered = QuestionAnswer.objects.filter(result=result).count() >= \
                       sum([stats.total_questions for stats in SectionStats.objects.filter(result=result)])

        if all_answered:
            test_submission.status = TestSubmission.COMPLETED
            test_submission.completion_date = timezone.now()
            mark_notification_as_read.delay(user_id=test_submission.student.id, category=Notification.TEST,
                                            reference_id=test_submission.id)
        else:
            test_submission.status = TestSubmission.IN_PROGRESS

        # Save the test submission status
        test_submission.save()
        result.save()

        return Response({"detail": "Section marked as completed."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['GET'], url_path='test-progress')
    def get_test_progress(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.query_params.get('test_submission_id')

        test_submission = TestSubmission.objects.get(id=test_submission_id)
        if not test_submission:
            return get_error_response(message='Test submission not found.')

        sections = Section.objects.filter(test=test)
        serialized_sections = SectionSerializer(sections, many=True).data

        result = Result.objects.filter(test_submission=test_submission).first()
        if not result:
            return Response({
                "test_id": test.id,
                "test_name": test.name,
                "course_name": test.course.name,
                "course_subject_id": 0,
                "subject": serialized_sections,
                "course_subject_index": 0,
                "section_id": 0,
                "section_index": 0,
                "remaining_time": -1,
                "question_id": 0,
                "question_index": 0,
                "answer_map": {}
            }, status=status.HTTP_200_OK)

        for course_subject_idx, section in enumerate(sections):  # subject
            for section_idx, sub_section in enumerate(section.sub_sections):  # section
                if test.format_type == Test.DYNAMIC:
                    section_key = f'{section.course_subject_id}_{sub_section["id"]}'
                    question_ids = test_submission.selected_question_ids.get(section_key, [])
                else:  # For LINEAR test type
                    question_ids = sub_section['questions']

                if not question_ids:
                    return Response({
                        "test_id": test.id,
                        "test_name": test.name,
                        "course_name": test.course.name,
                        "course_subject_id": section.course_subject_id,
                        "subject": serialized_sections,
                        "course_subject_index": course_subject_idx,
                        "section_id": sub_section['id'],
                        "section_index": section_idx,
                        "remaining_time": (sub_section['duration'] * 60),
                        "question_id": 0,
                        "question_index": 0,
                        "answer_map": {}
                    }, status=status.HTTP_200_OK)

                # Fetch all QuestionAnswer entries for this section
                question_answers = QuestionAnswer.objects.filter(
                    result=result,
                    course_subject_id=section.course_subject_id,
                    section_id=sub_section['id'],
                    question_id__in=question_ids
                )

                # Create a map of question answers for easier lookup
                question_answer_map = {qa.question_id: qa for qa in question_answers}

                answer_map = {}
                # Construct answer map for all the questions answered
                for question_idx, question_id in enumerate(question_ids):
                    if question_id in question_answer_map:
                        question_details = question_answer_map[question_id]
                        is_skipped = question_details.is_skipped
                        is_marked_for_review = question_details.is_marked_for_review
                        answer_map[str(question_id)] = {
                            "selected_options": {str(key): 1 for key in
                                                 question_details.selected_options} if not is_skipped else {},
                            "is_marked_for_review": is_marked_for_review,
                            "is_answered": not is_skipped,
                            "striked_options": {}
                        }

                # Construct the response to get the current course, section, and question index
                for question_idx, question_id in enumerate(question_ids):
                    # Check if the question is unanswered
                    if question_id not in question_answer_map:
                        # Fetch the total time taken for this section from SectionStats
                        section_stats = SectionStats.objects.filter(
                            result=result,
                            course_subject_id=section.course_subject_id,
                            section_id=sub_section['id']
                        ).first()
                        time_taken = section_stats.time_taken if section_stats else 0

                        return Response({
                            "test_id": test.id,
                            "test_name": test.name,
                            "course_name": test.course.name,
                            "course_subject_id": section.course_subject_id,
                            "subject": serialized_sections,
                            "course_subject_index": course_subject_idx,
                            "section_id": sub_section['id'],
                            "section_index": section_idx,
                            "remaining_time": (sub_section['duration'] * 60) - time_taken,
                            "question_id": question_id,
                            "question_index": question_idx,
                            "answer_map": answer_map
                        }, status=status.HTTP_200_OK)

        # Default response if no progress found
        return Response({
            "test_id": test.id,
            "test_name": test.name,
            "course_name": test.course.name,
            "course_subject_id": 0,
            "subject": serialized_sections,
            "course_subject_index": 0,
            "section_id": 0,
            "section_index": 0,
            "remaining_time": -1,
            "question_id": 0,
            "question_index": 0,
            "answer_map": {}
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['GET'], permission_classes=[IsStudent],
        url_path='section-questions')
    def get_section_questions(self, request, pk=None):
        test_id = pk
        course_subject_id = request.query_params.get('course_subject_id')
        section_id = request.query_params.get('section_id')
        test_submission_id = request.query_params.get('test_submission_id')

        if not course_subject_id or not section_id or not test_submission_id:
            return Response({"error": "course_subject_id and section_id are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            test = Test.get_test_by_id(test_id=test_id)
            test_submission = TestSubmission.objects.get(id=test_submission_id)
            section = Section.fetch_section_using_test_course_subject(test=test_id, course_subject=course_subject_id)
            sub_section = next((ss for ss in section.sub_sections if str(ss['id']) == section_id), None)
            print(f"Sub-section found: {sub_section}")
            print(f"Test format: {test.format_type}")

            if not sub_section:
                return Response({"error": "Sub-section not found."}, status=status.HTTP_404_NOT_FOUND)

            question_ids = None
            section_key = f'{course_subject_id}_{section_id}'

            # --------------------- LINEAR ---------------------
            if test.format_type == Test.LINEAR:
                question_ids = sub_section.get('questions', [])

                # ✅ Ensure RC questions last in LINEAR
                question_objs = Question.objects.filter(id__in=question_ids)
                rc_questions = [q.id for q in question_objs if q.question_subtype == "READING_COMPREHENSION"]
                other_questions = [q.id for q in question_objs if q.question_subtype != "READING_COMPREHENSION"]
                question_ids = other_questions + rc_questions

            # --------------------- DYNAMIC ---------------------
            elif test.format_type == Test.DYNAMIC:
                existing_selected_questions = test_submission.selected_question_ids.get(section_key)

                if not existing_selected_questions:
                    answered_questions, _ = AnsweredQuestions.objects.get_or_create(
                        student=test_submission.student,
                        course_subject_id=course_subject_id
                    )

                    question_ids = self.select_questions_for_section(
                        course_subject_id, section, section_id,
                        sub_section, test, test_submission,
                        excluded_question_ids=answered_questions.questions
                    )

                    # ✅ Ensure RC questions last in DYNAMIC
                    question_objs = Question.objects.filter(id__in=question_ids)
                    rc_questions = [q.id for q in question_objs if q.question_subtype == "READING_COMPREHENSION"]
                    other_questions = [q.id for q in question_objs if q.question_subtype != "READING_COMPREHENSION"]
                    question_ids = other_questions + rc_questions

                    # Save after ordering
                    test_submission.selected_question_ids[section_key] = question_ids
                    test_submission.save()

                    answered_questions.questions.extend(question_ids)
                    answered_questions.save()
                else:
                    question_ids = existing_selected_questions

            # --------------------- FLAT ---------------------
            elif test.format_type == Test.FLAT:
                existing_selected_questions = test_submission.selected_question_ids.get(section_key)

                if not existing_selected_questions:
                    all_questions = sub_section.get('questions', [])
                    question_objs = Question.objects.filter(id__in=all_questions)
                    rc_questions = [q.id for q in question_objs if q.question_subtype == "READING_COMPREHENSION"]
                    other_questions = [q.id for q in question_objs if q.question_subtype != "READING_COMPREHENSION"]
                    question_ids = other_questions + rc_questions

                    test_submission.selected_question_ids[section_key] = question_ids
                    test_submission.save()
                else:
                    question_ids = existing_selected_questions

            return Response(question_ids, status=status.HTTP_200_OK)

        except Section.DoesNotExist:
            return Response({"error": "Section not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            self.logger.error(f'Error in get_section_questions: {e}')
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def select_questions_for_section(self, course_subject_id, section, section_id, sub_section, test, test_submission,
                                     excluded_question_ids):
        question_ids = []
        if test.format_type == Test.LINEAR:
            question_ids = sub_section.get('questions', [])
        elif test.format_type == Test.DYNAMIC:
            # if section_id == "1":  # First section
            if section.order == 1 and section_id == "1":  # First section
                question_ids = self.get_first_section_questions(course_subject_id,
                                                                sub_section['no_of_questions'],
                                                                excluded_question_ids)
            else:
                result = Result.objects.get(test_submission=test_submission) if test_submission else None
                if result:
                    question_ids = self.get_dynamic_section_questions(course_subject_id, result,
                                                                      sub_section['no_of_questions'],
                                                                      excluded_question_ids)
                    section_stats, _ = SectionStats.objects.get_or_create(result=result,
                                                                          course_subject_id=course_subject_id,
                                                                          section_id=section_id,
                                                                          time_taken=0)
                    section_stats.total_questions = len(question_ids)
                    section_stats.save()
        return question_ids

    def get_first_section_questions(self, course_subject_id, num_questions, excluded_question_ids):
        questions = Question.objects.filter(
            course_subject_id=course_subject_id,
            test_type=Question.FULL_LENGTH_TEST_TYPE,
            is_active=True
        ).exclude(id__in=excluded_question_ids)
        print(f"Course subject: {course_subject_id}, Excluded: {excluded_question_ids}")
        print(f"Questions found: {list(questions.values_list('id', 'difficulty'))}")
        print(f"Num questions requested: {num_questions}")

        if questions.count() < num_questions:
            raise ValueError(f"Not enough active questions. Required: {num_questions}, Available: {questions.count()}")

        difficulty_levels = ['MODERATE', 'VERY_EASY', 'HARD', 'EASY', 'VERY_HARD']
        questions_per_difficulty = num_questions // len(difficulty_levels)

        question_ids = []
        for difficulty in difficulty_levels:
            questions_of_difficulty = [q.id for q in questions if q.difficulty == difficulty]
            selected_questions = random.sample(questions_of_difficulty,
                                            min(questions_per_difficulty, len(questions_of_difficulty)))
            question_ids.extend(selected_questions)

        # Distribute any remaining questions
        remaining_questions = num_questions - len(question_ids)
        while remaining_questions > 0:
            added_questions = False
            for difficulty in difficulty_levels:
                questions_of_difficulty = [q.id for q in questions if
                                        q.difficulty == difficulty and q.id not in question_ids]
                if questions_of_difficulty:
                    selected_question = random.choice(questions_of_difficulty)
                    question_ids.append(selected_question)
                    remaining_questions -= 1
                    added_questions = True
                    if remaining_questions == 0:
                        break
            if not added_questions:
                break

        return question_ids[:num_questions]


    def get_dynamic_section_questions(self, course_subject_id, result, num_questions, excluded_question_ids):
        correct_ratio = result.correct_answer_count / max(
            (result.correct_answer_count + result.incorrect_answer_count), 1
        )
        difficulty_ratios = self.get_difficulty_ratios_by_performance(correct_ratio)

        questions = Question.objects.filter(
            course_subject_id=course_subject_id,
            test_type=Question.FULL_LENGTH_TEST_TYPE,
            is_active=True
        ).exclude(id__in=excluded_question_ids)

        if questions.count() < num_questions:
            raise ValueError(f"Not enough active questions. Required: {num_questions}, Available: {questions.count()}")


        selected_questions = []

        # Select initial questions based on difficulty ratios
        for difficulty, ratio in difficulty_ratios.items():
            num_to_select = int(num_questions * ratio)
            questions_of_difficulty = [q.id for q in questions if q.difficulty == difficulty]
            selected_questions.extend(
                random.sample(questions_of_difficulty, min(num_to_select, len(questions_of_difficulty)))
            )

        # Redistribute remaining questions
        while len(selected_questions) < num_questions:
            additional_needed = num_questions - len(selected_questions)
            available_questions = [q.id for q in questions if q.id not in selected_questions]

            if not available_questions:
                break

            for difficulty in difficulty_ratios.keys():
                extra_questions = [q.id for q in questions if q.difficulty == difficulty and q.id not in selected_questions]
                if extra_questions:
                    selected_questions.append(random.choice(extra_questions))
                    if len(selected_questions) == num_questions:
                        break

        return selected_questions[:num_questions]

    def get_difficulty_ratios_by_performance(self, correct_ratio):
        # GMAT-like performance-based difficulty ratios
        if correct_ratio >= 0.80:
            return {'VERY_HARD': 0.4, 'HARD': 0.3, 'MODERATE': 0.2, 'EASY': 0.1, 'VERY_EASY': 0.0}
        elif correct_ratio >= 0.60:
            return {'VERY_HARD': 0.2, 'HARD': 0.4, 'MODERATE': 0.3, 'EASY': 0.1, 'VERY_EASY': 0.0}
        elif correct_ratio >= 0.40:
            return {'VERY_HARD': 0.1, 'HARD': 0.2, 'MODERATE': 0.4, 'EASY': 0.2, 'VERY_EASY': 0.1}

        return {'VERY_HARD': 0.1, 'HARD': 0.2, 'MODERATE': 0.3, 'EASY': 0.2, 'VERY_EASY': 0.2}

    @action(detail=True, methods=['POST'], permission_classes=[IsAdmin], url_path='reassign-expired-test')
    def reassign_expired_test(self, request, pk=None):
        try:
            test_submission = TestSubmission.objects.get(id=pk, status=TestSubmission.EXPIRED)

            # Update expiration_date and status
            test_submission.expiration_date = timezone.now() + timezone.timedelta(hours=48)
            test_submission.status = TestSubmission.YET_TO_START
            test_submission.save()

            # Delete any existing result associated with this test submission
            Result.objects.filter(test_submission=test_submission).delete()

            return Response({"message": "Test reassignment successful."}, status=status.HTTP_200_OK)
        except TestSubmission.DoesNotExist:
            return get_error_response('Test submission not found or not expired.')
        except Exception as e:
            return get_error_response(str(e))

    @action(detail=False, methods=['GET'], permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent], url_path='user-areas')
    def get_user_areas(self, request, *args, **kwargs):
        User = get_user_model()
        user = request.user
        student_id_param = request.query_params.get('student_id')

        if student_id_param:
            try:
                student = User.objects.get(id=student_id_param)
            except User.DoesNotExist:
                return Response({"error": "Invalid student_id"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            student = user

        date_range = request.query_params.get('date_range', 'last_six_month')
        start_date = None
        end_date = datetime.now()

        if date_range == 'last_month':
            start_date = end_date - timedelta(days=30)
        elif date_range == 'last_week':
            start_date = end_date - timedelta(days=7)
        elif date_range == 'last_six_month':
            start_date = end_date - timedelta(days=180)
        elif date_range == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            custom_start_date = request.query_params.get('start_date')
            custom_end_date = request.query_params.get('end_date')
            if custom_start_date and custom_end_date:
                start_date = datetime.strptime(custom_start_date, '%Y-%m-%d')
                end_date = datetime.strptime(custom_end_date, '%Y-%m-%d')
            else:
                return Response({"error": "Invalid custom date range."}, status=status.HTTP_400_BAD_REQUEST)

        topic_correct_counts = defaultdict(int)
        topic_total_counts = defaultdict(int)

        practice_test_results = PracticeTestResult.objects.filter(
            practice_test__student=student,
            created_at__range=(start_date, end_date)
        )
        practice_question_answers = PracticeQuestionAnswer.objects.filter(
            practice_test_result__in=practice_test_results
        )

        for question_answer in practice_question_answers:
            topic_name = question_answer.question.topic.name if question_answer.question.topic else "General"
            if question_answer.is_correct:
                topic_correct_counts[topic_name] += 1
            topic_total_counts[topic_name] += 1

        test_submissions = TestSubmission.objects.filter(student=student, status=TestSubmission.COMPLETED)
        full_length_results = Result.objects.filter(
            test_submission__in=test_submissions,
            created_at__range=(start_date, end_date)
        )
        question_answers = QuestionAnswer.objects.filter(result__in=full_length_results)

        for question_answer in question_answers:
            topic_name = question_answer.question.topic.name if question_answer.question.topic else "General"
            if question_answer.is_correct:
                topic_correct_counts[topic_name] += 1
            topic_total_counts[topic_name] += 1

        topic_stats = []
        for topic_name, correct_count in topic_correct_counts.items():
            total_count = topic_total_counts[topic_name]
            correct_percentage = (correct_count / total_count) * 100 if total_count > 0 else 0
            incorrect_count = total_count - correct_count
            topic_stats.append((topic_name, correct_count, incorrect_count, correct_percentage))

        areas_of_strength = sorted(
            [t for t in topic_stats if t[3] > 70],
            key=lambda x: x[1],
            reverse=True
        )[:3]

        areas_of_focus = sorted(
            [t for t in topic_stats if t[3] < 40],
            key=lambda x: x[2],
            reverse=True
        )[:3]

        response_data = {
            'areas_of_focus': {
                t[0]: {
                    'correct_count': t[1],
                    'incorrect_count': t[2],
                    'percentage': round(t[3], 2)
                } for t in areas_of_focus
            },
            'areas_of_strength': {
                t[0]: {
                    'correct_count': t[1],
                    'incorrect_count': t[2],
                    'percentage': round(t[3], 2)
                } for t in areas_of_strength
            }
        }

        return JsonResponse(response_data)


    @action(detail=False, methods=['GET'], permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent], url_path='test-stats')
    def get_test_stats(self, request, *args, **kwargs):
        User = get_user_model()
        user = request.user
        print("user",user)
        student_id_param = request.query_params.get('student_id')
        date_range = request.query_params.get('date_range',
                                              'last_six_month')  # Accepts 'last_month', 'last_week', 'today', or custom
        start_date = None
        end_date = datetime.now()

        if student_id_param:
            try:
                student = User.objects.get(id=student_id_param)
            except User.DoesNotExist:
                return Response({"error": "Invalid student_id"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            student = user
        print("student",student)    
        # Determine the start_date based on date_range
        if date_range == 'last_month':
            start_date = end_date - timedelta(days=30)
        elif date_range == 'last_week':
            start_date = end_date - timedelta(days=7)
        elif date_range == 'last_six_month':
            start_date = end_date - timedelta(days=180)
        elif date_range == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            # Custom date range
            custom_start_date = request.query_params.get('start_date')
            custom_end_date = request.query_params.get('end_date')
            if custom_start_date and custom_end_date:
                start_date = datetime.strptime(custom_start_date, '%Y-%m-%d')
                end_date = datetime.strptime(custom_end_date, '%Y-%m-%d')
            else:
                return Response({"error": "Invalid custom date range."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter practice tests and full-length tests within the date range
        practice_test_results = PracticeTestResult.objects.filter(
            practice_test__student=student,
            created_at__range=(start_date, end_date)
        )
        full_length_test_results = Result.objects.filter(
            test_submission__student=student,
            test_submission__status=TestSubmission.COMPLETED,
            created_at__range=(start_date, end_date)
        )

        # Calculate stats for practice tests
        practice_test_count = practice_test_results.count()
        practice_test_avg_score = practice_test_results.aggregate(avg_score=Avg('correct_answer_count'))[
                                      'avg_score'] or 0
        practice_test_total_questions = practice_test_results.aggregate(total_questions=Count('question_answers'))[
                                            'total_questions'] or 1
        practice_test_avg_percentage = (
                                               practice_test_avg_score / practice_test_total_questions) * 100 if practice_test_total_questions > 0 else 0

        # Calculate stats for full-length tests
        full_length_test_count = full_length_test_results.count()
        full_length_avg_score = full_length_test_results.aggregate(avg_score=Avg('correct_answer_count'))[
                                    'avg_score'] or 0
        full_length_total_questions = full_length_test_results.aggregate(total_questions=Count('question_answers'))[
                                          'total_questions'] or 1
        full_length_avg_percentage = (
                                             full_length_avg_score / full_length_total_questions) * 100 if full_length_total_questions > 0 else 0

        # Calculate overall average percentage
        combined_total_questions = practice_test_total_questions + full_length_total_questions
        combined_avg_percentage = ((
                                           practice_test_avg_score + full_length_avg_score) / combined_total_questions) * 100 if combined_total_questions > 0 else 0

        # Calculate percentage changes over the previous period
        previous_start_date = None
        if date_range == 'last_month':
            previous_start_date = start_date - timedelta(days=30)
        elif date_range == 'last_week':
            previous_start_date = start_date - timedelta(days=7)
        elif date_range == 'last_six_month':
            previous_start_date = start_date - timedelta(days=180)
        elif date_range == 'today':
            previous_start_date = start_date - timedelta(days=1)

        if previous_start_date:
            # Previous period stats for practice tests
            prev_practice_test_results = PracticeTestResult.objects.filter(
                practice_test__student=user,
                created_at__range=(previous_start_date, start_date)
            )
            prev_practice_avg_score = prev_practice_test_results.aggregate(avg_score=Avg('correct_answer_count'))[
                                          'avg_score'] or 0
            prev_practice_total_questions = \
                prev_practice_test_results.aggregate(total_questions=Count('question_answers'))['total_questions'] or 1
            prev_practice_avg_percentage = (
                                                   prev_practice_avg_score / prev_practice_total_questions) * 100 if prev_practice_total_questions > 0 else 0

            # Previous period stats for full-length tests
            prev_full_length_test_results = Result.objects.filter(
                test_submission__student=user,
                created_at__range=(previous_start_date, start_date)
            )
            prev_full_length_avg_score = prev_full_length_test_results.aggregate(avg_score=Avg('correct_answer_count'))[
                                             'avg_score'] or 0
            prev_full_length_total_questions = \
                prev_full_length_test_results.aggregate(total_questions=Count('question_answers'))[
                    'total_questions'] or 1
            prev_full_length_avg_percentage = (
                                                      prev_full_length_avg_score / prev_full_length_total_questions) * 100 if prev_full_length_total_questions > 0 else 0

            # Previous overall average percentage
            prev_combined_total_questions = prev_practice_total_questions + prev_full_length_total_questions
            prev_combined_avg_percentage = ((
                                                    prev_practice_avg_score + prev_full_length_avg_score) / prev_combined_total_questions) * 100 if prev_combined_total_questions > 0 else 0

            # Calculate percentage change
            practice_change = practice_test_avg_percentage - prev_practice_avg_percentage
            full_length_change = full_length_avg_percentage - prev_full_length_avg_percentage
            overall_change = combined_avg_percentage - prev_combined_avg_percentage
        else:
            practice_change = 0
            full_length_change = 0
            overall_change = 0

        # Construct the response data
        response_data = {
            "full_length_tests": {
                "count": full_length_test_count,
                "average_percentage": round(full_length_avg_percentage, 2),
                "change_percentage": round(full_length_change, 2)
            },
            "practice_tests": {
                "count": practice_test_count,
                "average_percentage": round(practice_test_avg_percentage, 2),
                "change_percentage": round(practice_change, 2)
            },
            "overall_average_percentage": {
                "average_percentage": round(combined_avg_percentage, 2),
                "change_percentage": round(overall_change, 2)
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)

    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent],
    url_path='tests-per-day'
)
    def get_tests_per_day(self, request, *args, **kwargs):
        User = get_user_model()
        user = request.user
        print("user",user)
        student_id_param = request.query_params.get('student_id')
        user = request.user
        date_range = request.query_params.get('date_range',
                                              'last_six_month')  # Accepts 'last_month', 'last_week', 'today', or custom
        start_date = None
        end_date = datetime.now()
        if student_id_param:
            try:
                student = User.objects.get(id=student_id_param)
            except User.DoesNotExist:
                return Response({"error": "Invalid student_id"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            if request.user.role.name == "student":
                student = request.user
            else:
                return Response({"error": "student_id is required for non-student users"}, status=status.HTTP_400_BAD_REQUEST)
  
        # Determine the start_date based on date_range
        if date_range == 'last_month':
            start_date = end_date - timedelta(days=30)
        elif date_range == 'last_week':
            start_date = end_date - timedelta(days=7)
        elif date_range == 'last_six_month':
            start_date = end_date - timedelta(days=180)
        elif date_range == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            # Custom date range
            custom_start_date = request.query_params.get('start_date')
            custom_end_date = request.query_params.get('end_date')
            if custom_start_date and custom_end_date:
                start_date = datetime.strptime(custom_start_date, '%Y-%m-%d')
                end_date = datetime.strptime(custom_end_date, '%Y-%m-%d')
            else:
                return Response({"error": "Invalid custom date range."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter and count practice tests given on each day within the date range
        practice_tests = PracticeTestResult.objects.filter(
            practice_test__student=student,
            created_at__range=(start_date, end_date)
        ).extra({'date': "date(test_manager_practicetestresult.created_at)"}).values('date').annotate(count=Count('id'))

        # Filter and count full-length tests given on each day within the date range
        full_length_tests = TestSubmission.objects.filter(
            student=student,
            result__created_at__range=(start_date, end_date)
        ).extra({'date': "date(test_manager_result.created_at)"}).values('date').annotate(count=Count('id'))

        # Prepare a dictionary to hold the test counts by date
        date_tests_map = {}

        # Process practice test counts
        for item in practice_tests:
            date_obj = item['date']
            if date_obj not in date_tests_map:
                date_tests_map[date_obj] = {'fullLengthTest': 0, 'practiceTest': 0}
            date_tests_map[date_obj]['practiceTest'] = item['count']

        # Process full-length test counts
        for item in full_length_tests:
            date_obj = item['date']
            if date_obj not in date_tests_map:
                date_tests_map[date_obj] = {'fullLengthTest': 0, 'practiceTest': 0}
            date_tests_map[date_obj]['fullLengthTest'] = item['count']

        # Construct the response list (sorted by actual date object)
        response_list = [
            {
                'date': date_obj.strftime("%d %b, %Y").lstrip("0"),
                'fullLengthTest': counts['fullLengthTest'],
                'practiceTest': counts['practiceTest']
            }
            for date_obj, counts in sorted(date_tests_map.items())
        ]

        return Response(response_list, status=status.HTTP_200_OK)


class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    logger = logging.getLogger('Results')


    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated], url_path='details')
    def get_details(self, request, *args, **kwargs):
        test_submission_id = request.GET.get('test_submission_id')
        test_submission = get_object_or_404(TestSubmission, id=test_submission_id)
        test = test_submission.test
        student = test_submission.student
        result = test_submission.result

        self.logger.info(f"🧩 Fetching result details for TestSubmission ID: {test_submission_id}, Test: {test.name}")

        response_data = {
            'testName': f'Test - {test.name}',
            'testDate': test_submission.assigned_date.strftime('%Y-%m-%d'),
            'studentName': student.name,
            'total_score': 0,
            'subjects': []
        }

        total_score = 0
        sections = Section.objects.filter(test=test).order_by('order')

        # map course_subject_id -> { course_subject, sections: [...] }
        subjects_map = {}
        for section in sections:
            subj_id = section.course_subject.id
            if subj_id not in subjects_map:
                subjects_map[subj_id] = {
                    'course_subject': section.course_subject,
                    'sections': []
                }
            subjects_map[subj_id]['sections'].append(section)

        # We'll collect question_ids for all subsections so we can bulk-fetch SelectionHistory
        for subj_id, subject_info in subjects_map.items():
            course_subject = subject_info['course_subject']
            subject_data = {
                'name': course_subject.subject.name,
                'selectedSection': 0,
                'subject_correct_count': 0,
                'subject_incorrect_count': 0,
                'subject_blank_count': 0,
                'subject_max_score': 0,
                'subject_min_score': 0,
                'subject_score': 0,
                'sections': []
            }

            section_1_score = section_2_score = 0

            for section in subject_info['sections']:
                correct_marks = section.course_subject.correct_answer_marks
                incorrect_marks = section.course_subject.incorrect_answer_marks

                for sub_section in section.sub_sections:
                    # choose question ids in this order:
                    section_key = f'{subj_id}_{sub_section.get("id")}'
                    if section_key in test_submission.selected_question_ids:
                        question_ids = test_submission.selected_question_ids[section_key]
                    elif str(sub_section.get("id")) in test_submission.selected_question_ids:
                        question_ids = test_submission.selected_question_ids[str(sub_section.get("id"))]
                    else:
                        question_ids = sub_section.get('questions', [])

                    # Logging
                    self.logger.info(f"✅ Using section_key={section_key}, found {len(question_ids)} questions → {question_ids}")

                    if not question_ids:
                        self.logger.warning(f"⚠️ No question IDs found for section {sub_section['id']} (subject {subj_id})")
                        continue

                    # Fetch QuestionAnswer entries
                    question_answers_qs = QuestionAnswer.objects.filter(
                        result=result,
                        course_subject_id=subj_id,
                        section_id=sub_section['id'],
                        question_id__in=question_ids
                    )
                    question_answers = {qa.question_id: qa for qa in question_answers_qs}

                    # Fetch Questions in bulk
                    question_map = {q.id: q for q in Question.objects.filter(id__in=question_ids)}

                    # Bulk fetch selection history for this subsection's questions
                    # Fetch all SelectionHistory for these question_ids and this test_submission (or practice_test_result)
                    selection_hist_qs = SelectionHistory.objects.filter(
                        test_submission=test_submission,
                        question_id__in=question_ids
                    ).order_by('timestamp').values(
                        'question_id', 'timestamp', 'selected_options', 'striked_options', 'action_type'
                    )

                    # Build map: question_id -> [history entries ...]
                    selection_map = {}
                    for rec in selection_hist_qs:
                        qid = rec['question_id']
                        entry = {
                            'timestamp': rec['timestamp'].isoformat() if rec['timestamp'] else None,
                            'selected_options': rec['selected_options'] or [],
                            'striked_options': rec['striked_options'] or [],
                            'action_type': rec['action_type']
                        }
                        selection_map.setdefault(qid, []).append(entry)

                    self.logger.info(f"✅ Loaded {len(question_map)} Questions, {len(question_answers)} QuestionAnswers, selection history for {len(selection_map)} questions")

                    # Prepare counters and lists
                    section_correct_count = section_incorrect_count = section_blank_count = marked = 0
                    section_correct_time_taken = section_incorrect_time_taken = 0
                    section_max_score = 0
                    section_min_score = 0

                    topic_correct_counts, topic_total_counts = {}, {}
                    questions_data = []

                    sr_counter = 1
                    # preserve the question order as in question_ids
                    for idx, qid in enumerate(question_ids):
                        question = question_map.get(qid)
                        if not question:
                            self.logger.warning(f"🚫 Missing question with ID {qid} (possibly deleted)")
                            continue

                        qa = question_answers.get(qid)
                        topic_name = question.topic.name if question.topic else "General"
                        sub_topic_name = None
                        if question.sub_topic_id:
                            sub_topic = SubTopic.objects.filter(id=question.sub_topic_id).first()
                            sub_topic_name = sub_topic.name if sub_topic else None

                        topic_correct_counts.setdefault(topic_name, 0)
                        topic_total_counts.setdefault(topic_name, 0)
                        if qa and qa.is_correct:
                            topic_correct_counts[topic_name] += 1
                        topic_total_counts[topic_name] += 1

                        # Add selection history (if any)
                        q_selection_history = selection_map.get(qid, [])

                        question_data = {
                            'sr_no': sr_counter,
                            'question_id': question.id,
                            'question_type': question.question_type,
                            'question_subtype': getattr(question, 'question_subtype', None),
                            'topic': topic_name,
                            'sub_topic': sub_topic_name,
                            'result': qa.is_correct if qa else False,
                            'total_time': qa.time_taken if qa else 0,
                            'first_time_taken': qa.first_time_taken if qa else 0,
                            'second_time_taken': qa.second_time_taken if qa else 0,
                            'third_time_taken': qa.third_time_taken if qa else 0,
                            'times_visited': qa.times_visited if qa else 0,
                            'marked': qa.is_marked_for_review if qa else False,
                            'is_skipped': qa.is_skipped if qa else False,
                            'selected_options': qa.selected_options if qa else [],
                            'db_Srno': question.srno,
                            'difficulty': question.difficulty,
                            'test_type': question.test_type,
                            # <-- new field
                            'selection_history': q_selection_history,
                        }
                        sr_counter += 1

                        # update counters
                        if qa:
                            if qa.is_correct:
                                section_correct_count += 1
                                section_correct_time_taken += qa.time_taken or 0
                            elif qa.is_skipped:
                                section_blank_count += 1
                            else:
                                section_incorrect_count += 1
                                section_incorrect_time_taken += qa.time_taken or 0

                            if qa.is_marked_for_review:
                                marked += 1

                        questions_data.append(question_data)

                    # topic stats
                    topic_stats = [
                        (t, c, topic_total_counts[t] - c, (c / topic_total_counts[t] * 100 if topic_total_counts[t] else 0))
                        for t, c in topic_correct_counts.items()
                    ]

                    areas_of_strength = {
                        t[0]: {'correct_count': t[1], 'incorrect_count': t[2]}
                        for t in sorted([t for t in topic_stats if t[3] > 70],
                                        key=lambda x: x[1], reverse=True)[:3]
                    }

                    areas_of_focus = {
                        t[0]: {'correct_count': t[1], 'incorrect_count': t[2]}
                        for t in sorted([t for t in topic_stats if t[3] < 40],
                                        key=lambda x: x[2], reverse=True)[:3]
                    }

                    section_score = (section_correct_count * correct_marks) - (section_incorrect_count * incorrect_marks)

                    section_data = {
                        'name': sub_section['name'],
                        'section_id': sub_section['id'],
                        'course_subject_id': subj_id,
                        'test_id': test.id,
                        'test_type': "FULL_LENGTH_TEST",
                        'section_correct_count': section_correct_count,
                        'section_incorrect_count': section_incorrect_count,
                        'section_blank_count': section_blank_count,
                        'marked': marked,
                        'time_on_section': section_stats.time_taken if (section_stats := SectionStats.objects.filter(result=result, course_subject_id=subj_id, section_id=sub_section['id']).first()) else 0,
                        'section_correct_time_taken': section_correct_time_taken,
                        'section_incorrect_time_taken': section_incorrect_time_taken,
                        'section_max_score': section_max_score,
                        'section_score': section_score,
                        'questions_data': questions_data,
                        'areas_of_focus': areas_of_focus,
                        'areas_of_strength': areas_of_strength,
                    }
                        # NEW — now track for all courses
                    print("hii",sub_section)    
                    if sub_section['id'] == 1:
                        section_1_score = section_correct_count
                    else:
                        section_2_score = section_correct_count

                    subject_data['sections'].append(section_data)
                    subject_data['subject_correct_count'] += section_correct_count
                    subject_data['subject_incorrect_count'] += section_incorrect_count
                    subject_data['subject_blank_count'] += section_blank_count
                    subject_data['subject_max_score'] += section_max_score
                    subject_data['subject_min_score'] += section_min_score
                    subject_data['subject_score'] += section_score

            # NEW — CombinedScore used for ALL courses
            
            score_record = CombinedScore.objects.filter(
                section1_correct=section_1_score,
                section2_correct=section_2_score,
                subject_name=course_subject.subject.name
            ).first()

            if score_record:
                subject_data['subject_min_score'] = 200
                subject_data['subject_max_score'] = 800
                subject_data['subject_score'] = score_record.total_score
                total_score += score_record.total_score

            response_data['subjects'].append(subject_data)

        response_data['total_score'] = total_score
        self.logger.info(f"✅ Final Total Score: {total_score}")
        return JsonResponse(response_data)

        #             # SAT special handling (unchanged)
        #             if course_subject.course.name == 'SAT':
        #                 if sub_section['id'] == 1:
        #                     section_1_score = section_correct_count
        #                 else:
        #                     section_2_score = section_correct_count

        #             subject_data['sections'].append(section_data)
        #             subject_data['subject_correct_count'] += section_correct_count
        #             subject_data['subject_incorrect_count'] += section_incorrect_count
        #             subject_data['subject_blank_count'] += section_blank_count
        #             subject_data['subject_max_score'] += section_max_score
        #             subject_data['subject_min_score'] += section_min_score
        #             subject_data['subject_score'] += section_score

        #             if course_subject.course.name != 'SAT':
        #                 total_score += section_score

        #     # SAT combined-score handling (unchanged)
        #     if course_subject.course.name == 'SAT':
        #         subject_data['subject_min_score'] = 200
        #         subject_data['subject_max_score'] = 800
        #         score_record = CombinedScore.objects.get(
        #             section1_correct=section_1_score,
        #             section2_correct=section_2_score,
        #             subject_name=course_subject.subject.name
        #         )
        #         subject_data['subject_score'] = score_record.total_score
        #         total_score += score_record.total_score

        #     response_data['subjects'].append(subject_data)

        # response_data['total_score'] = total_score
        # self.logger.info(f"✅ Final Total Score: {total_score}")
        # return JsonResponse(response_data)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated], url_path='Subject_Wise_Practice')
    def Subject_Wise_Practice(self, request, *args, **kwargs):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type", "all")  # full, practice, all

        if not student_id or not course_id:
            return Response({"error": "student_id and course_id are required"}, status=400)

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)
        course_subjects = CourseSubjects.objects.filter(course=course)

        response = []

        for cs in course_subjects:

            # ⭐ Total available questions in DB for this subject
            total_questions = Question.objects.filter(course_subject=cs).count()

            # -------------------------------------------------------
            # ⭐ PRACTICED QUESTIONS COLLECTOR
            # -------------------------------------------------------
            practiced_ids = set()

            # ========= FULL LENGTH TESTS ==========
            if test_type in ["fullLength", "all"]:
                full_practiced = QuestionAnswer.objects.filter(
                    result__test_submission__student=student,
                    course_subject=cs
                ).values_list("question_id", flat=True)

                practiced_ids |= set(full_practiced)

            # ========= PRACTICE TESTS ==========
            if test_type in ["practiceTest", "all"]:
                practice_tests = PracticeTest.objects.filter(student=student, course_subject=cs)

                practice_practiced = PracticeQuestionAnswer.objects.filter(
                    practice_test_result__practice_test__in=practice_tests
                ).values_list("question_id", flat=True)

                practiced_ids |= set(practice_practiced)

            practiced_count = len(practiced_ids)

            # -------------------------------------------------------
            # ⭐ PERCENT CALCULATION
            # -------------------------------------------------------
            percent = round((practiced_count / total_questions) * 100, 2) if total_questions else 0

            response.append({
                "subject": cs.subject.name,
                "total_questions": total_questions,
                "practiced_questions": practiced_count,
                "practice_percent": percent,
                "test_type_used": test_type
            })

        return Response(response)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated], url_path='Subject_Wise_Accuracy')
    def Subject_Wise_Accuracy(self, request, *args, **kwargs):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type", "all")  # fullLength, practiceTest, all

        if not student_id or not course_id:
            return Response({"error": "student_id and course_id are required"}, status=400)

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)
        course_subjects = CourseSubjects.objects.filter(course=course)

        response = []
        
        for cs in course_subjects:

            # ------------------------------------------
            # ⭐ COLLECT RIGHT & ATTEMPTED COUNTS
            # ------------------------------------------
            right_ids = set()
            attempted_ids = set()

            # ========== FULL LENGTH =============
            if test_type in ["fullLength", "all"]:

                full_answers = QuestionAnswer.objects.filter(
                    result__test_submission__student=student,
                    course_subject=cs,
                    is_skipped=False  # attempted only
                )

                # attempted
                attempted_ids |= set(full_answers.values_list("question_id", flat=True))

                # right
                right_full = full_answers.filter(is_correct=True).values_list("question_id", flat=True)
                right_ids |= set(right_full)

            # ========== PRACTICE TEST ============
            if test_type in ["practiceTest", "all"]:

                practice_tests = PracticeTest.objects.filter(student=student, course_subject=cs)

                practice_answers = PracticeQuestionAnswer.objects.filter(
                    practice_test_result__practice_test__in=practice_tests,
                    is_skipped=False
                )

                # attempted
                attempted_ids |= set(practice_answers.values_list("question_id", flat=True))

                # right
                right_practice = practice_answers.filter(is_correct=True).values_list("question_id", flat=True)
                right_ids |= set(right_practice)

            total_attempted = len(attempted_ids)
            total_right = len(right_ids)

            # ------------------------------------------
            # ⭐ ACCURACY CALCULATION
            # ------------------------------------------
            accuracy = round((total_right / total_attempted) * 100, 2) if total_attempted else 0

            response.append({
                "subject": cs.subject.name,
                "total_attempted": total_attempted,
                "right_questions": total_right,
                "accuracy_percent": accuracy,
                "test_type_used": test_type
            })

        return Response(response)


    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAuthenticated],
    url_path='Subject_Wise_Time'
)
    def Subject_Wise_Time(self, request, *args, **kwargs):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type", "all")  # fullLength, practiceTest, all

        if not student_id or not course_id:
            return Response({"error": "student_id and course_id are required"}, status=400)

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)
        course_subjects = CourseSubjects.objects.filter(course=course)

        response = []

        for cs in course_subjects:

            total_time_seconds = 0
            total_attempted = 0

            # ================================
            # FULL LENGTH TESTS
            # ================================
            if test_type in ["fullLength", "all"]:
                full_qas = QuestionAnswer.objects.filter(
                    result__test_submission__student=student,
                    course_subject=cs,
                    time_taken__gt=0
                )

                total_time_seconds += sum(qa.time_taken or 0 for qa in full_qas)
                total_attempted += full_qas.count()

            # ================================
            # PRACTICE TESTS
            # ================================
            if test_type in ["practiceTest", "all"]:
                practice_tests = PracticeTest.objects.filter(
                    student=student,
                    course_subject=cs
                )

                practice_qas = PracticeQuestionAnswer.objects.filter(
                    practice_test_result__practice_test__in=practice_tests,
                    time_taken__gt=0
                )

                total_time_seconds += sum(qa.time_taken or 0 for qa in practice_qas)
                total_attempted += practice_qas.count()

            # ================================
            # CALCULATE AVERAGE TIME
            # ================================
            avg_time_seconds = round(total_time_seconds / total_attempted, 2) if total_attempted else 0

            response.append({
                "subject": cs.subject.name,
                "total_attempted": total_attempted,
                "total_time_seconds": total_time_seconds,
                "avg_time_seconds": avg_time_seconds,
                "test_type_used": test_type
            })

        return Response(response)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated], url_path='Date_Wise_Time')
    def Date_Wise_Time(self, request, *args, **kwargs):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type", "all")  # fullLength, practiceTest, all

        if not student_id or not course_id:
            return Response({"error": "student_id and course_id are required"}, status=400)

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        # Final result list
        date_map = {}

        # =======================
        # ⭐ FULL LENGTH TEST TIME
        # =======================
        if test_type in ["fullLength", "all"]:
            full_qas = QuestionAnswer.objects.filter(
                result__test_submission__student=student,
                course_subject__course=course
            ).values("result__test_submission__assigned_date__date", "time_taken")

            for item in full_qas:
                dt = item["result__test_submission__assigned_date__date"]
                secs = item["time_taken"] or 0
                date_map[dt] = date_map.get(dt, 0) + secs

        # =======================
        # ⭐ PRACTICE TEST TIME
        # =======================
        if test_type in ["practiceTest", "all"]:
            practice_qas = PracticeQuestionAnswer.objects.filter(
                practice_test_result__practice_test__student=student,
                practice_test_result__practice_test__course_subject__course=course
            ).values("practice_test_result__created_at__date", "time_taken")

            for item in practice_qas:
                dt = item["practice_test_result__created_at__date"]
                secs = item["time_taken"] or 0
                date_map[dt] = date_map.get(dt, 0) + secs

        # =======================
        # ⭐ BUILD RESPONSE
        # =======================
        response = []
        for dt, total_seconds in sorted(date_map.items()):
            response.append({
                "date": dt.strftime("%Y-%m-%d") if isinstance(dt, datetime) else str(dt),
                "seconds": total_seconds
            })

        return Response(response)

class PracticeTestViewSet(viewsets.ModelViewSet):
    queryset = PracticeTest.objects.all()
    logger = logging.getLogger('Practice-Test')


    @action(detail=True, methods=['POST'], url_path='selection-history')
    def save_selection_history(self, request, pk=None, *args, **kwargs):
        practice_test_result_id = request.data.get('practice_test_result_id')
        question_id = request.data.get('question_id')
        selected_options = request.data.get('selected_options', [])
        striked_options = request.data.get('striked_options', [])
        action_type = request.data.get('action_type', 'SELECT')

        if not practice_test_result_id or not question_id:
            return Response({"detail": "Missing practice_test_result_id or question_id."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            practice_result = PracticeTestResult.objects.get(id=practice_test_result_id)
            question = Question.objects.get(id=question_id)
        except (PracticeTestResult.DoesNotExist, Question.DoesNotExist):
            return Response({"detail": "Invalid result or question ID."}, status=status.HTTP_400_BAD_REQUEST)

        SelectionHistory.objects.create(
            student=request.user,
            question=question,
            practice_test_result=practice_result,
            selected_options=selected_options,
            striked_options=striked_options,
            action_type=action_type
        )

        return Response({"detail": "Selection history recorded successfully."}, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['GET'], url_path='test-performance-report')
    def test_performance_report(self, request):
        course_id = request.query_params.get('course_id')
        date_range = request.query_params.get('date_range', 'last_six_month')

        try:
            end_date = now()
            start_date = end_date - timedelta(days=120)

            if date_range == 'today':
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif date_range == 'last_week':
                start_date = end_date - timedelta(days=7)
            elif date_range == 'last_month':
                start_date = end_date - timedelta(days=30)
            elif date_range == 'custom':
                start = request.query_params.get('start_date')
                end = request.query_params.get('end_date')
                if not start or not end:
                    return Response({'error': 'start_date and end_date are required for custom range'}, status=400)
                start_date = make_aware(datetime.combine(parse_date(start), time.min))
                end_date = make_aware(datetime.combine(parse_date(end), time.max))

            filters = {"created_at__range": (start_date, end_date)}
            if course_id:
                filters["practice_test__course_subject__course_id"] = course_id

            results = PracticeTestResult.objects.filter(**filters).select_related(
                "practice_test__student",
                "practice_test__course_subject",
                "practice_test__course_subject__course"
            )

            response_data = []

            for result in results:
                practice_test = result.practice_test
                student = practice_test.student.name
                test_name = f"test_{practice_test.created_at.strftime('%m_%d')}"
                course_subject = practice_test.course_subject
                course = course_subject.course.name

                correct_marks = course_subject.correct_answer_marks
                incorrect_marks = course_subject.incorrect_answer_marks

                # Ensure we select question's subject and topic in one query
                answers = result.question_answers.select_related("question__course_subject__subject", "question__topic").all()

                total_questions = answers.count()
                attempted_questions = sum(1 for a in answers if not a.is_skipped)
                if attempted_questions == 0:
                    continue
                correct_count = sum(1 for a in answers if a.is_correct and not a.is_skipped)
                incorrect_count = sum(1 for a in answers if not a.is_correct and not a.is_skipped)

                raw_score = (correct_count * correct_marks) - (incorrect_count * incorrect_marks)
                total_score = max(raw_score, 0)  # Avoid negative scores
                total_marks = total_questions * correct_marks

                # Topic breakdown
                topic_data = defaultdict(lambda: [0, 0])
                for ans in answers:
                    if ans.question and ans.question.topic and not ans.is_skipped:
                        topic = ans.question.topic.name
                        correct = int(ans.is_correct)
                        topic_data[topic][0] += correct
                        topic_data[topic][1] += 1

                topic_array = [
                    {"topic": topic, "score": f"{correct}/{total}"}
                    for topic, (correct, total) in topic_data.items()
                ]

                # Subject breakdown
                subject_scores = defaultdict(lambda: [0, 0])

                for ans in answers:
                    question = getattr(ans, "question", None)
                    if not question or not hasattr(question, "course_subject"):
                        continue

                    course_subject = question.course_subject
                    subject = getattr(course_subject, "subject", None)

                    if subject and not ans.is_skipped:
                        subject_name = subject.name
                        correct = int(ans.is_correct)
                        subject_scores[subject_name][0] += correct
                        subject_scores[subject_name][1] += 1

                subject_array = list(subject_scores.keys())


                response_data.append({
                    "student": student,
                    "test_name": test_name,
                    "course": course,
                    "subject": subject_array,
                    "total_mark": total_marks,
                    "total_score": f"{total_score}/{total_marks}",
                    "total_questions": total_questions,
                    "attempted_questions": attempted_questions,
                    "topic": topic_array
                })

            return Response(response_data)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['GET'], url_path='practice-test-scores')
    def practice_test_scores(self, request):
        course_id = request.query_params.get('course_id')
        subject_id = request.query_params.get('subject_id')
        topic_id = request.query_params.get('topic_id')
        subtopic_id = request.query_params.get('subtopic_id')
        date_range = request.query_params.get('date_range', 'last_six_month')

        if not course_id:
            return Response({'error': 'course_id is required'}, status=400)

        try:
            end_date = now()
            start_date = None

            if date_range == 'today':
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif date_range == 'last_week':
                start_date = end_date - timedelta(days=7)
            elif date_range == 'last_month':
                start_date = end_date - timedelta(days=30)
            elif date_range == 'last_six_month':
                start_date = end_date - timedelta(days=120)
            elif date_range == 'custom':
                custom_start = request.query_params.get('start_date')
                custom_end = request.query_params.get('end_date')
                if custom_start and custom_end:
                    start_date = parse_date(custom_start)
                    end_date = parse_date(custom_end) + timedelta(days=1)
                else:
                    return Response({'error': 'start_date and end_date are required for custom range'}, status=400)
            else:
                start_date = end_date - timedelta(days=30)

            filters = {
                "practice_test__course_subject__course_id": course_id,
                "created_at__range": (start_date, end_date),
            }

            if subject_id:
                filters["practice_test__course_subject__subject_id"] = subject_id

            practice_results = PracticeTestResult.objects.filter(**filters).select_related(
                "practice_test__student", "practice_test__course_subject", "practice_test__course_subject__course"
            )

            student_data = defaultdict(lambda: {
                'total_score': 0,
                'total_marks': 0,
                'test_count': 0,
                'total_time': 0
            })

            for result in practice_results:
                course_subject = result.practice_test.course_subject
                student_name = result.practice_test.student.name

                answers = result.question_answers.select_related('question').all()

                if topic_id:
                    answers = answers.filter(question__topic_id=int(topic_id))
                if subtopic_id:
                    answers = answers.filter(question__sub_topic_id=int(subtopic_id))

                correct_count = answers.filter(is_correct=True, is_skipped=False).count()
                incorrect_count = answers.filter(is_correct=False, is_skipped=False).count()

                if correct_count == 0 and incorrect_count == 0:
                    continue

                score = (correct_count * course_subject.correct_answer_marks) - (
                    incorrect_count * course_subject.incorrect_answer_marks
                )
                total_marks = (correct_count + incorrect_count) * course_subject.correct_answer_marks

                student_data[student_name]['total_score'] += score
                student_data[student_name]['total_marks'] += total_marks
                student_data[student_name]['test_count'] += 1
                student_data[student_name]['total_time'] += (result.time_taken or 0) / 60




            response_data = []
            for student, data in student_data.items():
                average_score = round(data['total_score'] / data['test_count'], 2)
                response_data.append({
                    "student": student,
                    "average_score": average_score,
                    "total_score": data['total_score'],
                    "total_marks": data['total_marks'],
                    "test_count": data['test_count'],
                    "total_time": round(data['total_time'], 2)
                    
                })

            return Response(response_data)

        except CourseSubjects.DoesNotExist:
            return Response({"error": "Invalid subject_id for given course_id"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
        

        




    @action(detail=False, methods=['GET'], permission_classes=[IsStudent],
            url_path='(?P<course_subject_id>\d+)')
    def list_questions_by_subject_for_practice_test(self, request, course_subject_id=None):
        if not course_subject_id:
            self.logger.exception('Error processing the request because no course subject id was provided')
            return get_error_response('Subject is mandatory')

        questions = Question.get_questions_for_subject_test_type(course_subject_id=course_subject_id,
                                                                 test_type=Question.SELF_PRACTICE_TEST_TYPE)

        # Apply dynamic filtering
        filter_backends = [DjangoFilterBackend]
        filterset = PracticeQuestionFilter(request.GET, queryset=questions)
        if not filterset.is_valid():
            return get_error_response('Invalid filter parameters')

        filtered_questions = filterset.qs

        question_ids = [question.id for question in filtered_questions]
        random.shuffle(question_ids)

        return Response(question_ids, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], permission_classes=[IsStudent], url_path='start-practice')
    def start_practice_test(self, request):
        from test_manager.models import PracticeTest, PracticeTestResult, PracticeQuestionAnswer, CourseSubjects, Question  # ✅ correct imports

        student = request.user
        course_subject_id = request.data.get('course_subject_id')
        if not course_subject_id:
            return get_error_response("course_subject_id is required")

        query_filters = Q(course_subject_id=course_subject_id, test_type=Question.SELF_PRACTICE_TEST_TYPE)

        topic = request.data.get('topic', '')
        if topic:
            query_filters &= Q(topic__in=topic.split(','))

        sub_topic = request.data.get('sub_topic', '')
        if sub_topic:
            query_filters &= Q(sub_topic__in=sub_topic.split(','))

        difficulty = request.data.get('difficulty', '')
        if difficulty:
            query_filters &= Q(difficulty__in=difficulty.split(','))

        questions = Question.objects.filter(query_filters)
        course_subject = get_object_or_404(CourseSubjects, id=course_subject_id)

        practice_test = PracticeTest.objects.create(student=student, course_subject=course_subject)

        question_ids = [q.id for q in questions]
        random.shuffle(question_ids)

        # ✅ Handle no_of_questions
        no_of_questions = int(request.data.get('no_of_questions', 0))
        if no_of_questions > 0:
            question_ids = question_ids[:no_of_questions]

        # 1️⃣ Create the result object
        practice_test_result = PracticeTestResult.objects.create(
            practice_test=practice_test,
            correct_answer_count=0,
            incorrect_answer_count=0,
            time_taken=0,
            detailed_view={}
        )

        # 2️⃣ Create placeholder PracticeQuestionAnswer objects with order preserved
        bulk_objs = []
        for idx, qid in enumerate(question_ids):
            bulk_objs.append(PracticeQuestionAnswer(
                practice_test_result=practice_test_result,
                question_id=qid,
                order=idx,                     # preserve shuffled order
                is_correct=False,
                is_skipped=True,               # not answered yet
                time_taken=0,
                selected_options=[],
                times_visited=0,
                first_time_taken=0,
                is_marked_for_review=False
            ))
        PracticeQuestionAnswer.objects.bulk_create(bulk_objs)

        return Response(
            {
                'practice_test_id': practice_test.id,
                'question_ids': question_ids
            },
            status=status.HTTP_201_CREATED
        )


    @permission_classes([IsAdminOrMentorOrFacultyOrStudentOrParent])
    def list(self, request):
        user = request.user
        student_ids = []

        if user.role.name == 'student':
            # Only include practice tests with results
            practice_tests = PracticeTest.objects.filter(
                student=user, result__isnull=False
            ).prefetch_related('result')

        elif user.role.name in ['parent', 'faculty', 'mentor', 'admin']:
            if user.role.name == 'parent':
                sm = StudentMetadata.objects.filter(Q(father=user) | Q(mother=user))
                student_ids = sm.values_list('student', flat=True)

            elif user.role.name == 'faculty':
                sm = StudentMetadata.objects.filter(faculties=user)  # Correct field
                student_ids = sm.values_list('student', flat=True)

            elif user.role.name == 'mentor':
                sm = StudentMetadata.objects.filter(mentor=user)
                student_ids = sm.values_list('student', flat=True)

            elif user.role.name == 'admin':
                student_id = request.GET.get('student_id')
                if student_id:
                    student_ids = [student_id]
                else:
                    student_ids = StudentMetadata.objects.all().values_list('student', flat=True)

            # Fetch practice tests for the resolved student_ids
            practice_tests = PracticeTest.objects.filter(
                student__in=student_ids, result__isnull=False
            ).prefetch_related('result')

        else:
            return get_error_response('Access denied')

        # Apply dynamic filtering using the PracticeTestFilter
        filterset = PracticeTestFilter(request.GET, queryset=practice_tests)
        if not filterset.is_valid():
            return get_error_response('Invalid filter parameters')

        filtered_tests = filterset.qs

        # Apply pagination
        paginator = CustomPageNumberPagination()
        paginated_practice_tests = paginator.paginate_queryset(filtered_tests, request)

        serializer = PracticeTestListSerializer(
            paginated_practice_tests, many=True, context={'request': request}
        )

        return paginator.get_paginated_response(serializer.data)

    @action(
    detail=True,
    methods=['POST'],
    permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent],
    url_path='take-test'
)
    def take_test(self, request, pk=None):
        practice_test = PracticeTest.objects.get(id=pk)

        # Parse data
        answer_dict = request.data.get('answer', {})
        striked_dict = request.data.get('striked_options', {})  # 👈 new
        is_skipped = request.data.get('is_skipped', False)
        time_taken = request.data.get('time_taken', 0)
        is_marked_for_review = request.data.get('is_marked_for_review', False)

        # Extract question id + answer data
        question_id, answer_data = list(answer_dict.items())[0]
        question = Question.objects.get(id=question_id)
        striked_data = striked_dict.get(str(question_id), [])

        # Determine correctness
        is_correct = None
        if is_skipped:
            is_correct = False
        elif question.question_type == Question.FILL_IN_BLANKS:
            correct_answers_lower = [ans.lower() for ans in question.options]
            user_answers_lower = [ans.lower() for ans in answer_data]
            is_correct = correct_answers_lower == user_answers_lower
        elif question.question_type == Question.GRIDIN:
            answer_data = answer_data[0]
            if question.question_subtype in [Question.GRIDIN_SINGLE_ANSWER, Question.GRIDIN_MULTI_ANSWER]:
                is_correct = Question.compare_answers(answer_data, question.options)
            else:
                is_correct = evaluate_expression(question.options, answer_data)
        else:
            correct_options = [index for index, option in enumerate(question.options) if option['is_correct']]
            if not is_skipped:
                is_correct = set(answer_data) == set(correct_options)

        # Fetch or create result
        result, _ = PracticeTestResult.objects.get_or_create(
            practice_test=practice_test,
            defaults={'correct_answer_count': 0, 'incorrect_answer_count': 0, 'time_taken': 0, 'detailed_view': {}}
        )

        # Update question-level answer with strike info
        result.update_question_answer(
            question=question,
            answer_data=answer_data,
            time_taken=time_taken,
            correct_answer=is_correct,
            is_skipped=is_skipped,
            is_marked_for_review=is_marked_for_review,
            striked_data=striked_data,  # 👈 pass here
        )

        response = {
            'correct_answer_count': result.correct_answer_count,
            'incorrect_answer_count': result.incorrect_answer_count,
            'time_taken': result.time_taken
        }

        return Response(data=response, status=status.HTTP_200_OK)


    @action(detail=True, methods=['GET'],
        permission_classes=[IsAdminOrMentorOrFacultyOrStudentOrParent],
        url_path='results')
    def get_practice_test_results(self, request, pk=None):
        practice_test_result = PracticeTestResult.objects.filter(practice_test_id=pk).first()

        if not practice_test_result:
            return Response({"error": "Results not found for the specified practice test."},
                            status=status.HTTP_404_NOT_FOUND)

        practice_test = practice_test_result.practice_test
        section_answer_correct_marks = practice_test.course_subject.correct_answer_marks
        section_answer_incorrect_marks = practice_test.course_subject.incorrect_answer_marks
        course = practice_test.course_subject.course
        subject = practice_test.course_subject.subject

        section_correct_count = 0
        section_correct_time_taken = 0
        section_incorrect_count = 0
        section_incorrect_time_taken = 0
        section_blank_count = 0
        marked = 0

        topic_correct_counts = {}
        topic_total_counts = {}

        questions_data = []

        question_answers = PracticeQuestionAnswer.objects.filter(
            practice_test_result=practice_test_result
        ).order_by('order')

        for index, question_answer in enumerate(question_answers):
            question_instance = question_answer.question
            topic_name = question_instance.topic.name if question_instance.topic else "General"

            if topic_name not in topic_correct_counts:
                topic_correct_counts[topic_name] = 0
                topic_total_counts[topic_name] = 0

            if question_answer.is_correct:
                topic_correct_counts[topic_name] += 1
            topic_total_counts[topic_name] += 1

            question_data = {
                'sr_no': index + 1,
                'question_id': question_instance.id,
                'question_type': question_instance.question_type,
                'topic': topic_name,
                'sub_topic': question_instance.sub_topic.name if question_instance.sub_topic else None,
                'result': question_answer.is_correct,
                'total_time': question_answer.time_taken,
                'first_time_taken': question_answer.first_time_taken,
                'times_visited': question_answer.times_visited,
                'marked': question_answer.is_marked_for_review,
                'is_skipped': question_answer.is_skipped,
                'selected_options': question_answer.selected_options,
                'db_Srno': question_instance.srno,
                'difficulty': question_instance.difficulty,
                'test_type': question_instance.test_type
            }

            section_correct_count += 1 if question_answer.is_correct else 0
            section_correct_time_taken += question_answer.time_taken if question_answer.is_correct else 0
            section_incorrect_count += 1 if not question_answer.is_correct and not question_answer.is_skipped else 0
            section_incorrect_time_taken += question_answer.time_taken if not question_answer.is_correct and not question_answer.is_skipped else 0
            section_blank_count += 1 if question_answer.is_skipped else 0
            marked += 1 if question_answer.is_marked_for_review else 0

            questions_data.append(question_data)

        # --- Threshold Logic ---
        strength_threshold = 70

        areas_of_strength = {}
        areas_of_focus = {}

        for topic_name, correct_count in topic_correct_counts.items():
            total_count = topic_total_counts[topic_name]
            correct_percentage = (correct_count / total_count) * 100 if total_count else 0
            incorrect_count = total_count - correct_count

            topic_data = {
                'correct_count': correct_count,
                'incorrect_count': incorrect_count,
                'accuracy': round(correct_percentage, 1)
            }

            if correct_percentage >= strength_threshold:
                areas_of_strength[topic_name] = topic_data
            else:
                areas_of_focus[topic_name] = topic_data

        # Limit to top 3 each for readability
        areas_of_strength = dict(sorted(areas_of_strength.items(),
                                        key=lambda x: x[1]['accuracy'],
                                        reverse=True)[:3])
        areas_of_focus = dict(sorted(areas_of_focus.items(),
                                    key=lambda x: x[1]['accuracy'])[:3])

        section_data = {
            'name': 'Practice Test - ' + course.name + ': ' + subject.name,
            'student_name': practice_test.student.name,
            'testDate': practice_test_result.created_at.strftime('%Y-%m-%d'),
            'test_type': "PRACTICE_TEST",
            'section_correct_count': section_correct_count,
            'section_correct_time_taken': section_correct_time_taken,
            'section_incorrect_count': section_incorrect_count,
            'section_incorrect_time_taken': section_incorrect_time_taken,
            'section_blank_count': section_blank_count,
            'marked': marked,
            'time_on_section': practice_test_result.time_taken,
            'section_max_score': len(questions_data) * section_answer_correct_marks,
            'section_score': (section_correct_count * section_answer_correct_marks) -
                            (section_incorrect_count * section_answer_incorrect_marks),
            'questions_data': questions_data,
            'areas_of_focus': areas_of_focus,
            'areas_of_strength': areas_of_strength,
        }

        return JsonResponse(section_data)


class TestFeedbackViewSet(viewsets.ModelViewSet):
    queryset = TestFeedback.objects.all()
    serializer_class = TestFeedbackSerializer
    logger = logging.getLogger('test-feedback')

    def create(self, request, *args, **kwargs):
        serializer = TestFeedbackSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response("Your feedback has been noted!", status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)


def get_expression_value(option_value):
    expression_lst = []
    for key, value in option_value.items():
        if key in Question.operator_mapper.keys():
            expression_lst.append((Question.operator_mapper[key], value))

    return expression_lst


def evaluate_expression(answer_option, answer):
    for option_value in answer_option:
        expression_tuple_lst = get_expression_value(option_value)
        value = all(eval(f"{answer}{operator}{number}") for operator, number in expression_tuple_lst)
        if value:
            return value
    else:
        return False



