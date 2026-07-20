# ==========================
# Standard Library
# ==========================
import logging
import random
import csv
from collections import defaultdict
from datetime import datetime, timedelta, time

# ==========================
# Django Core
# ==========================
from django.db import transaction
from django.db.models import (
    Q, F, Avg, Sum, Count, Max
)
from django.db.models.functions import TruncDate
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.timezone import make_aware, localtime
from django.utils.dateparse import parse_date
from django.core.exceptions import FieldError

# ==========================
# Django REST Framework
# ==========================
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser
)
from rest_framework.response import Response

# ==========================
# Filters & Pagination
# ==========================
from django_filters.rest_framework import DjangoFilterBackend

# ==========================
# Permissions
# ==========================
from sTest.permissions import (
    IsAdmin,
    IsStudent,
    IsAdminOrMentorOrFaculty,
    IsAdminOrMentorOrFacultyOrStudentOrParent
)

# ==========================
# Utils
# ==========================
from sTest.utils import (
    get_error_response,
    get_error_response_for_serializer,
    CustomPageNumberPagination
)

# ==========================
# User & Auth
# ==========================
from user_manager.models import User, Role, StudentMetadata

# ==========================
# Course Manager
# ==========================
from course_manager.models import (
    Course,
    Subject,
    CourseSubjects,
    Topic,
    SubTopic,
    CombinedScore
)
from course_manager.filters import PracticeQuestionFilter

# ==========================
# Notification Manager
# ==========================
from notification_manager.models import Notification, NotificationTemplate
from notification_manager.utils import (
    send_notification,
    mark_notification_as_read
)

# ==========================
# Test Manager Models
# ==========================
from test_manager.models import (
    Test,
    Section,
    TestSubmission,
    Result,
    PracticeTest,
    PracticeTestResult,
    TestFeedback,
    QuestionAnswer,
    PracticeQuestionAnswer,
    SectionStats,
    AnsweredQuestions,
    SelectionHistory
)

# ==========================
# Test Manager Serializers
# ==========================
from test_manager.serializers import (
    RecentFullLengthResultSerializer,
    RecentPracticeTestSerializer,
    TestSerializer,
    TestListSerializer,
    TestSubmissionSerializer,
    PracticeTestListSerializer,
    EligibleStudentSerializer,
    SectionSerializer,
    TestFeedbackSerializer,
    ExistingStudentListSerializer
)

# ==========================
# Test Manager Filters
# ==========================
from test_manager.filters import (
    TestFilter,
    TestSubmissionFilter,
    PracticeTestFilter
)

# ==========================
# Test Manager Utils
# ==========================
from test_manager.utils import calculate_total_questions_required

from course_manager.models import Question

from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg, Max, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.timezone import now
from django.contrib.auth import get_user_model

from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from test_manager.models import (
    TestSubmission,
    Result,
    Section,
    SectionStats,
    QuestionAnswer,
    PracticeTestResult
)

from course_manager.models import (
    Course,
    CourseSubjects,
    CombinedScore
)

from user_manager.models import User
from course_manager.models import CourseEnrollment


from django.db.models import (
    Q, Count, F, IntegerField, FloatField, ExpressionWrapper
)
from django.db.models.functions import Coalesce, NullIf

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from test_manager.models import (
    QuestionAnswer,
    PracticeQuestionAnswer,
    TestSubmission,
    PracticeTestResult
)

from .serializers import AttemptedQuestionSerializer
from test_manager.tasks import send_test_completion_email
from test_manager.models import TestNavigationHistory, TestPatternSummary, SelectionHistory


class AttemptedQuestionsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.get_all()
    serializer_class = TestSerializer
    logger = logging.getLogger('Tests')


    @action(detail=True, methods=['POST'], url_path='track-navigation')
    def track_navigation(self, request, pk=None):
        """
        Track student navigation pattern during test taking
        """
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.data.get('test_submission_id')
        action_type = request.data.get('action_type')  # NEXT, PREVIOUS, JUMP, SECTION_SKIP, REVIEW
        from_question_id = request.data.get('from_question_id')
        to_question_id = request.data.get('to_question_id')
        from_section_id = request.data.get('from_section_id')
        to_section_id = request.data.get('to_section_id')
        time_spent = request.data.get('time_spent', 0)
        current_question_index = request.data.get('current_question_index', 0)
        total_questions = request.data.get('total_questions', 0)
        device_info = request.data.get('device_info', {})
        
        # Validate
        if not test_submission_id or not action_type:
            return Response(
                {"detail": "test_submission_id and action_type are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            test_submission = TestSubmission.objects.get(id=test_submission_id)
            question = None
            if to_question_id:
                question = Question.objects.get(id=to_question_id)
        except (TestSubmission.DoesNotExist, Question.DoesNotExist):
            return Response(
                {"detail": "Invalid submission or question ID."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create navigation history entry
        navigation = TestNavigationHistory.objects.create(
            student=request.user,
            test_submission=test_submission,
            question=question,
            action_type=action_type,
            from_question_id=from_question_id,
            to_question_id=to_question_id,
            from_section_id=from_section_id,
            to_section_id=to_section_id,
            time_spent_on_previous_question=time_spent,
            current_section_id=to_section_id or from_section_id,
            current_question_index=current_question_index,
            total_questions_in_section=total_questions,
            device_info=device_info
        )
        
        # Analyze and update pattern summary
        self._analyze_pattern(test_submission)
        
        return Response({
            "detail": "Navigation tracked successfully.",
            "navigation_id": navigation.id
        }, status=status.HTTP_201_CREATED)


    def _analyze_pattern(self, test_submission):
        """
        Analyze navigation pattern and create/update summary
        """
        from test_manager.models import TestNavigationHistory, TestPatternSummary
        
        # Get all navigation history for this submission
        navigations = TestNavigationHistory.objects.filter(
            test_submission=test_submission
        ).order_by('timestamp')
        
        if navigations.count() < 3:
            return  # Need at least 3 navigations to analyze
        
        # Initialize counters
        sequential_count = 0
        jump_count = 0
        back_and_forth_count = 0
        total_revisits = 0
        revisits_per_question = defaultdict(int)
        sections_skipped = 0
        reviews = 0
        total_time_before_nav = 0
        
        prev_question = None
        visited_questions = set()
        
        for nav in navigations:
            # Count navigation types
            if nav.action_type == 'NEXT':
                sequential_count += 1
            elif nav.action_type == 'PREVIOUS':
                back_and_forth_count += 1
            elif nav.action_type == 'JUMP':
                jump_count += 1
            elif nav.action_type == 'SECTION_SKIP':
                sections_skipped += 1
            elif nav.action_type == 'REVIEW':
                reviews += 1
            
            # Track revisits
            if nav.to_question_id:
                if nav.to_question_id in visited_questions:
                    total_revisits += 1
                    revisits_per_question[nav.to_question_id] += 1
                else:
                    visited_questions.add(nav.to_question_id)
            
            # Track time
            total_time_before_nav += nav.time_spent_on_previous_question
            prev_question = nav.to_question_id
        
        # Determine primary pattern
        total_nav = navigations.count()
        sequential_percent = (sequential_count / total_nav) * 100
        jump_percent = (jump_count / total_nav) * 100
        back_forth_percent = (back_and_forth_count / total_nav) * 100
        
        if sequential_percent > 60:
            primary_pattern = TestPatternSummary.PATTERN_SEQUENTIAL
        elif back_forth_percent > 40:
            primary_pattern = TestPatternSummary.PATTERN_BACK_AND_FORTH
        elif jump_percent > 40:
            primary_pattern = TestPatternSummary.PATTERN_JUMPING
        else:
            primary_pattern = TestPatternSummary.PATTERN_MIXED
        
        # Calculate efficiency score (higher is better)
        # Sequential pattern is generally more efficient
        efficiency_score = 0
        if primary_pattern == TestPatternSummary.PATTERN_SEQUENTIAL:
            efficiency_score = 85 + (sequential_percent - 60) * 0.3
        elif primary_pattern == TestPatternSummary.PATTERN_JUMPING:
            efficiency_score = 60 + (100 - jump_percent) * 0.3
        elif primary_pattern == TestPatternSummary.PATTERN_BACK_AND_FORTH:
            efficiency_score = 40 + (100 - back_forth_percent) * 0.4
        else:
            efficiency_score = 50
        
        efficiency_score = min(100, max(0, efficiency_score))
        
        # Calculate time management score
        avg_time = total_time_before_nav / total_nav if total_nav > 0 else 0
        # Ideal time per question is around 60 seconds
        time_score = 100 - max(0, (avg_time - 60) / 60 * 10)  # 10% penalty per 60 seconds over
        time_score = max(0, min(100, time_score))
        
        # Create or update summary
        summary, created = TestPatternSummary.objects.get_or_create(
            student=test_submission.student,
            test_submission=test_submission,
            defaults={
                'primary_pattern': primary_pattern,
                'total_navigations': total_nav,
                'sequential_moves': sequential_count,
                'jump_moves': jump_count,
                'back_and_forth_moves': back_and_forth_count,
                'total_revisits': total_revisits,
                'avg_revisits_per_question': total_revisits / len(visited_questions) if visited_questions else 0,
                'avg_time_before_navigation': int(avg_time),
                'sections_skipped': sections_skipped,
                'questions_marked_for_review': reviews,
                'review_visit_count': reviews,
                'navigation_efficiency_score': round(efficiency_score, 2),
                'time_management_score': round(time_score, 2),
            }
        )
        
        if not created:
            # Update existing summary
            summary.primary_pattern = primary_pattern
            summary.total_navigations = total_nav
            summary.sequential_moves = sequential_count
            summary.jump_moves = jump_count
            summary.back_and_forth_moves = back_and_forth_count
            summary.total_revisits = total_revisits
            summary.avg_revisits_per_question = total_revisits / len(visited_questions) if visited_questions else 0
            summary.avg_time_before_navigation = int(avg_time)
            summary.sections_skipped = sections_skipped
            summary.questions_marked_for_review = reviews
            summary.review_visit_count = reviews
            summary.navigation_efficiency_score = round(efficiency_score, 2)
            summary.time_management_score = round(time_score, 2)
            summary.save()
    

    @action(detail=True, methods=['GET'], url_path='pattern-analysis')
    def get_pattern_analysis(self, request, pk=None):
        """
        Get detailed pattern analysis for a test submission
        """
        test_submission_id = request.query_params.get('test_submission_id')
        
        if not test_submission_id:
            return Response(
                {"error": "test_submission_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            test_submission = TestSubmission.objects.get(id=test_submission_id)
        except TestSubmission.DoesNotExist:
            return Response(
                {"error": "Test submission not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get pattern summary
        try:
            summary = TestPatternSummary.objects.get(
                student=request.user,
                test_submission=test_submission
            )
        except TestPatternSummary.DoesNotExist:
            return Response({
                "message": "No pattern data available yet. Student needs to take the test first.",
                "has_data": False
            })
        
        # Get detailed navigation history
        navigations = TestNavigationHistory.objects.filter(
            student=request.user,
            test_submission=test_submission
        ).order_by('timestamp')
        
        # Prepare navigation timeline
        timeline = []
        for nav in navigations:
            timeline.append({
                "timestamp": nav.timestamp.isoformat(),
                "action": nav.action_type,
                "from_question": nav.from_question_id,
                "to_question": nav.to_question_id,
                "time_spent": nav.time_spent_on_previous_question,
                "section": nav.current_section_id,
                "index": nav.current_question_index
            })
        
        # Pattern interpretation
        pattern_meanings = {
            TestPatternSummary.PATTERN_SEQUENTIAL: {
                "description": "Student follows the test in order, one question at a time.",
                "recommendation": "Good time management. Student is systematic."
            },
            TestPatternSummary.PATTERN_JUMPING: {
                "description": "Student skips difficult questions and returns later.",
                "recommendation": "Strategic approach. Good for time management on hard questions."
            },
            TestPatternSummary.PATTERN_BACK_AND_FORTH: {
                "description": "Student frequently revisits questions, indicating possible uncertainty.",
                "recommendation": "May need to build confidence. Consider more practice."
            },
            TestPatternSummary.PATTERN_MIXED: {
                "description": "Student uses a combination of navigation strategies.",
                "recommendation": "Adaptive approach. Monitor which strategy works best."
            }
        }
        
        meaning = pattern_meanings.get(summary.primary_pattern, {})
        
        return Response({
            "has_data": True,
            "summary": {
                "primary_pattern": summary.primary_pattern,
                "pattern_description": meaning.get("description", ""),
                "recommendation": meaning.get("recommendation", ""),
                "navigation_efficiency": summary.navigation_efficiency_score,
                "time_management_score": summary.time_management_score,
            },
            "statistics": {
                "total_navigations": summary.total_navigations,
                "sequential_moves": summary.sequential_moves,
                "jump_moves": summary.jump_moves,
                "back_and_forth_moves": summary.back_and_forth_moves,
                "questions_revisited": summary.total_revisits,
                "avg_revisits_per_question": summary.avg_revisits_per_question,
                "sections_skipped": summary.sections_skipped,
                "questions_marked_for_review": summary.questions_marked_for_review,
            },
            "timeline": timeline,
            "interpretation": {
                "is_sequential": summary.primary_pattern == TestPatternSummary.PATTERN_SEQUENTIAL,
                "is_jumping": summary.primary_pattern == TestPatternSummary.PATTERN_JUMPING,
                "is_back_and_forth": summary.primary_pattern == TestPatternSummary.PATTERN_BACK_AND_FORTH,
                "confidence_level": "High" if summary.total_navigations > 20 else "Medium" if summary.total_navigations > 10 else "Low"
            }
        })

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

    

    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[AllowAny],
    url_path="key-strengths"
)
    def get_key_strengths(self, request):
        from user_manager.models import User
        from test_manager.models import (
            TestSubmission, Result, QuestionAnswer,
            PracticeTestResult, PracticeQuestionAnswer
        )

        # --------------------------------------------------
        # Query Params
        # --------------------------------------------------
        course_id = request.query_params.get("course_id")
        student_id = request.query_params.get("student_id")
        test_type = request.query_params.get("test_type")  # PRACTICE | EXAM | ASSIGNMENT
        test_id = request.query_params.get("test_id")

        date_range = request.query_params.get("date_range", "last_six_month")
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")

        # --------------------------------------------------
        # Validation
        # --------------------------------------------------
        if not course_id or student_id is None:
            return Response(
                {"error": "course_id and student_id are required"},
                status=400
            )

        try:
            course_id = int(course_id)
        except ValueError:
            return Response({"error": "Invalid course_id"}, status=400)

        VALID_TEST_TYPES = ["PRACTICE", "EXAM", "ASSIGNMENT"]
        if test_type and test_type not in VALID_TEST_TYPES:
            return Response(
                {"error": f"Invalid test_type. Allowed: {VALID_TEST_TYPES}"},
                status=400
            )

        # --------------------------------------------------
        # Students
        # --------------------------------------------------
        if student_id == "":
            students = User.objects.filter(role_id=5)
        else:
            try:
                students = [User.objects.get(id=student_id, role_id=5)]
            except User.DoesNotExist:
                return Response({"error": "Invalid student_id"}, status=400)

        # --------------------------------------------------
        # Date Range
        # --------------------------------------------------
        today = datetime.today()

        try:
            if start_date_str and end_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)
            else:
                if date_range == "today":
                    start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = today + timedelta(days=1)
                elif date_range == "last_week":
                    start_date = today - timedelta(days=7)
                    end_date = today + timedelta(days=1)
                elif date_range == "last_month":
                    start_date = today - timedelta(days=30)
                    end_date = today + timedelta(days=1)
                else:  # last_six_month
                    start_date = today - timedelta(days=180)
                    end_date = today + timedelta(days=1)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=400
            )

        # --------------------------------------------------
        # Aggregation Containers
        # --------------------------------------------------
        topic_correct = defaultdict(int)
        topic_total = defaultdict(int)
        topic_section = {}

        section_correct = defaultdict(int)
        section_total = defaultdict(int)

        # ==================================================
        # 🔵 PRACTICE TEST LOGIC (NO SECTIONS)
        # ==================================================
        if test_type == "PRACTICE":
            practice_results = PracticeTestResult.objects.filter(
                practice_test__student__in=students,
                practice_test__course_subject__course_id=course_id,
                created_at__gte=start_date,
                created_at__lt=end_date
            )

            practice_answers = PracticeQuestionAnswer.objects.filter(
                practice_test_result__in=practice_results
            ).select_related(
                "question",
                "question__topic",
                "question__course_subject__subject"
            )

            for ans in practice_answers:
                topic = ans.question.topic
                subject_name = (
                    ans.question.course_subject.subject.name
                    if ans.question.course_subject and ans.question.course_subject.subject
                    else "General"
                )

                if not topic:
                    continue

                topic_name = topic.name

                if "Math" in subject_name:
                    section = "Math"
                elif "English" in subject_name:
                    section = "English"
                else:
                    section = "General"

                topic_total[topic_name] += 1
                section_total[section] += 1
                topic_section[topic_name] = section

                if ans.is_correct:
                    topic_correct[topic_name] += 1
                    section_correct[section] += 1

        # ==================================================
        # 🟢 FULL LENGTH / ASSIGNMENT LOGIC (HAS SECTIONS)
        # ==================================================
        else:
            test_submissions = TestSubmission.objects.filter(
                student__in=students,
                status=TestSubmission.COMPLETED,
                test__course_id=course_id,
                completion_date__gte=start_date,
                completion_date__lt=end_date
            )

            if test_type:
                test_submissions = test_submissions.filter(test__test_type=test_type)

            if test_id:
                test_submissions = test_submissions.filter(test_id=test_id)

            results = Result.objects.filter(test_submission__in=test_submissions)

            question_answers = QuestionAnswer.objects.filter(
                result__in=results
            ).select_related(
                "question",
                "question__topic",
                "question__course_subject__subject"
            )

            for ans in question_answers:
                topic = ans.question.topic
                subject_name = (
                    ans.question.course_subject.subject.name
                    if ans.question.course_subject and ans.question.course_subject.subject
                    else "General"
                )

                if not topic:
                    continue

                topic_name = topic.name

                if "Math" in subject_name:
                    section = "Math"
                elif "English" in subject_name:
                    section = "English"
                else:
                    section = "General"

                topic_total[topic_name] += 1
                section_total[section] += 1
                topic_section[topic_name] = section

                if ans.is_correct:
                    topic_correct[topic_name] += 1
                    section_correct[section] += 1

        # --------------------------------------------------
        # Build Response
        # --------------------------------------------------
        topic_data = defaultdict(list)
        for topic, total in topic_total.items():
            correct = topic_correct[topic]
            score = round((correct / total) * 100, 2) if total else 0
            section = topic_section.get(topic, "General")

            topic_data[section].append({
                "topic": topic,
                "score": score
            })

        section_data = []
        for section, total in section_total.items():
            correct = section_correct[section]
            score = round((correct / total) * 100, 2) if total else 0

            section_data.append({
                "section": section,
                "score": score
            })

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

        # Validate students
        valid_students = User.filter_users_using_id_and_role(
            user_ids=student_ids,
            role=Role.get_role_using_name('student').id
        )

        if valid_students.count() != len(student_ids):
            return get_error_response(message='One or more student IDs are invalid.')

        blocked_students = []

        for student in valid_students:
            # 🔹 check if student is paid
            is_paid = CourseEnrollment.objects.filter(
                student=student
            ).exclude(subscription_type=CourseEnrollment.FREE).exists()

            if not is_paid:
                # 🔹 count how many tests already assigned
                assigned_count = TestSubmission.objects.filter(student=student).count()

                if assigned_count >= 2:
                    blocked_students.append(student.name)

        # ❌ If any free student crossed limit → block
        if blocked_students:
            names = ", ".join(blocked_students)
            return Response(
                {
                    "detail": (
                        f"This test cannot be assigned to the following student(s) "
                        f"because they are free users and already have 2 tests assigned: "
                        f"{names}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Assign students
        test.students.add(*student_ids)

        assigned_date = timezone.now()
        expiration_date = assigned_date + timedelta(hours=48)

        for student in valid_students:
            test_submission = TestSubmission.objects.create(
                test=test,
                student=student,
                assigned_date=assigned_date,
                expiration_date=expiration_date
            )

            # Notification
            notification_params = {
                NotificationTemplate.USER_NAME: student.name,
                NotificationTemplate.TEST_NAME: test.name,
                NotificationTemplate.REFERENCE_ID: test_submission.id
            }

            send_notification.delay(
                notification_name=Notification.TEST_ASSIGNED_NOTIFICATION,
                params=notification_params,
                user_id=student.id
            )

        return Response(
            {"detail": "Students added successfully."},
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['POST'], url_path='take-test')
    def take_test(self, request, pk=None, *args, **kwargs):
        """
        Submit an answer for a question in a test and track navigation patterns
        """
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.data.get('test_submission_id')
        
        if not test_submission_id:
            return get_error_response(message='test_submission_id is required.')
        
        try:
            existing_submission = TestSubmission.objects.get(id=test_submission_id)
        except TestSubmission.DoesNotExist:
            return get_error_response(message='Test submission not found.')

        # Check if the test has expired
        if existing_submission.status == TestSubmission.EXPIRED:
            return get_error_response(
                message='Test has expired. Please contact the Admin to reassign the Test.'
            )

        # Extract data from request - support both formats
        course_subject = request.data.get('course_subject')
        section_id = request.data.get('section_id')
        
        # ✅ FIX: Support both formats
        # Format 1: question_id directly
        question_id = request.data.get('question_id')
        answer_data = request.data.get('answer_data', [])
        selected_options = request.data.get('selected_options', [])
        
        # Format 2: answer dict {question_id: [selected_options]}
        if not question_id:
            answer_dict = request.data.get('answer', {})
            if answer_dict:
                # Get the first key-value pair
                question_id = list(answer_dict.keys())[0] if answer_dict else None
                selected_options = answer_dict.get(question_id, [])
                answer_data = selected_options
        
        # Format 3: selected_options as dict with question_id as key
        if not question_id:
            selected_options_dict = request.data.get('selected_options', {})
            if isinstance(selected_options_dict, dict) and selected_options_dict:
                question_id = list(selected_options_dict.keys())[0] if selected_options_dict else None
                selected_options = selected_options_dict.get(question_id, [])
                answer_data = selected_options
        
        is_skipped = request.data.get('is_skipped', False)
        time_taken = request.data.get('time_taken', 0)
        is_marked_for_review = request.data.get('is_marked_for_review', False)
        striked_options = request.data.get('striked_options', {})
        
        # Handle striked_options - could be dict or list
        if isinstance(striked_options, dict):
            striked_list = striked_options.get(question_id, []) if question_id else []
        else:
            striked_list = striked_options
        
        # Navigation tracking data
        navigation_action = request.data.get('navigation_action', 'NEXT')
        from_question_id = request.data.get('from_question_id')
        to_question_id = request.data.get('to_question_id', question_id)
        from_section_id = request.data.get('from_section_id', section_id)
        to_section_id = request.data.get('to_section_id', section_id)
        current_question_index = request.data.get('current_question_index', 0)
        total_questions = request.data.get('total_questions', 0)
        time_spent_on_question = request.data.get('time_spent_on_question', time_taken)
        device_info = request.data.get('device_info', {})
        
        # ✅ Validate required fields
        if not course_subject:
            return get_error_response(message='course_subject is required.')
        
        if not section_id:
            return get_error_response(message='section_id is required.')
        
        if not question_id:
            return get_error_response(
                message='question_id is required. Please provide either "question_id" or "answer" field.'
            )
        
        # Convert question_id to int if it's a string
        try:
            question_id = int(question_id)
        except (ValueError, TypeError):
            return get_error_response(message='Invalid question_id format.')

        try:
            # Get or create result
            result, created = Result.objects.get_or_create(
                test_submission=existing_submission,
                defaults={
                    "correct_answer_count": 0,
                    "incorrect_answer_count": 0,
                    "time_taken": 0,
                    "detailed_view": {}
                }
            )

            # Get the question
            question = Question.get_question_by_id(question_id=question_id)
            
            # Determine if the answer is correct
            is_correct = None
            if is_skipped:
                is_correct = False  # Mark skipped questions as incorrect
            elif question.question_type == Question.FILL_IN_BLANKS:
                correct_answers_lower = [ans.lower() for ans in question.options]
                user_answers_lower = [ans.lower() for ans in answer_data]
                is_correct = correct_answers_lower == user_answers_lower
            elif question.question_type == Question.GRIDIN:
                if answer_data and len(answer_data) > 0:
                    answer_value = answer_data[0]
                    if question.question_subtype in [Question.GRIDIN_SINGLE_ANSWER, Question.GRIDIN_MULTI_ANSWER]:
                        is_correct = Question.compare_answers(answer_value, question.options)
                    else:
                        is_correct = evaluate_expression(question.options, answer_value)
                else:
                    is_correct = False
            else:
                # MCQ type questions
                correct_options = [index for index, option in enumerate(question.options) if option.get('is_correct', False)]
                if not is_skipped:
                    # Convert selected_options to list of indices
                    if isinstance(selected_options, dict):
                        selected_indices = [int(k) for k, v in selected_options.items() if v]
                    elif isinstance(selected_options, list):
                        selected_indices = selected_options
                    else:
                        selected_indices = []
                    is_correct = set(selected_indices) == set(correct_options)
                else:
                    is_correct = False

            # Update Result with the answer
            result.update_question_answer_and_stats(
                test=test,
                course_subject=course_subject,
                section_id=section_id,
                question=question,
                answer_data=answer_data if not is_skipped else [],
                time_taken=time_taken,
                correct_answer=is_correct,
                is_skipped=is_skipped,
                is_marked_for_review=is_marked_for_review
            )

            

            # ✅ Save selection history for analytics
            SelectionHistory.objects.create(
                student=request.user,
                question=question,
                test_submission=existing_submission,
                selected_options=selected_options if not is_skipped else [],
                striked_options=striked_list,
                action_type='SUBMIT' if not is_skipped else 'SKIP'
            )

            # ✅ TRACK NAVIGATION PATTERN
            self._track_navigation_internal(
                test_submission_id=test_submission_id,
                student=request.user,
                action_type=navigation_action,
                from_question_id=from_question_id or question_id,
                to_question_id=to_question_id or question_id,
                from_section_id=from_section_id or section_id,
                to_section_id=to_section_id or section_id,
                time_spent=time_spent_on_question or time_taken,
                current_question_index=current_question_index,
                total_questions=total_questions,
                device_info=device_info
            )

            # Check if the test is completed
            self._check_test_completion(existing_submission, result)
            print("correct_answer_count",result.correct_answer_count)   
            print("incorrect_answer_count",result.incorrect_answer_count)  
            print("time_taken",result.time_taken)
            


            response = {
                'correct_answer_count': result.correct_answer_count,
                'incorrect_answer_count': result.incorrect_answer_count,
                'time_taken': result.time_taken,
                'is_correct': is_correct,
                'status': existing_submission.status,
                'test_submission_id': existing_submission.id,
                'question_id': question_id,
                'is_skipped': is_skipped,
                'is_marked_for_review': is_marked_for_review
            }

            return Response(data=response, status=status.HTTP_200_OK)

        except Question.DoesNotExist:
            return get_error_response(
                message=f'Question with ID {question_id} does not exist.'
            )
        except Exception as e:
            self.logger.error(f'Error in take_test: {str(e)}')
            return get_error_response(message=f'Error processing test: {str(e)}')


    def _track_navigation_internal(self, test_submission_id, student, action_type, 
                                from_question_id=None, to_question_id=None,
                                from_section_id=None, to_section_id=None,
                                time_spent=0, current_question_index=0, 
                                total_questions=0, device_info=None):
        """
        Internal method to track navigation without exposing as API
        """
        try:
            test_submission = TestSubmission.objects.get(id=test_submission_id)
            question = None
            if to_question_id:
                question = Question.objects.get(id=to_question_id)
        except (TestSubmission.DoesNotExist, Question.DoesNotExist):
            return
        
        # Create navigation history entry
        TestNavigationHistory.objects.create(
            student=student,
            test_submission=test_submission,
            question=question,
            action_type=action_type,
            from_question_id=from_question_id,
            to_question_id=to_question_id,
            from_section_id=from_section_id,
            to_section_id=to_section_id,
            time_spent_on_previous_question=time_spent,
            current_section_id=to_section_id or from_section_id,
            current_question_index=current_question_index,
            total_questions_in_section=total_questions,
            device_info=device_info or {}
        )
        
        # Analyze and update pattern summary (only if enough data)
        self._analyze_pattern(test_submission)


    def _check_test_completion(self, test_submission, result):
        """
        Check if the test is completed and update status
        """
        # Get total questions from all sections
        sections = Section.objects.filter(test=test_submission.test)
        total_questions = 0
        for section in sections:
            for sub_section in section.sub_sections:
                if test_submission.test.format_type == Test.DYNAMIC:
                    section_key = f'{section.course_subject.id}_{sub_section["id"]}'
                    questions = test_submission.selected_question_ids.get(section_key, [])
                else:
                    questions = sub_section.get('questions', [])
                total_questions += len(questions)
        
        # Count answered questions
        answered_count = QuestionAnswer.objects.filter(result=result).count()
        
        # Check if all questions are answered

        print("TOTAL QUESTIONS:", total_questions)
        print("ANSWERED:", answered_count)

        print(
            QuestionAnswer.objects.filter(result=result).values(
                "question_id",
                "course_subject_id",
                "section_id",
                "is_skipped",
            )
        )
        if answered_count >= total_questions:
            test_submission.status = TestSubmission.IN_PROGRESS
            test_submission.completion_date = timezone.now()
            test_submission.save()
            
            
            
            # Analyze final pattern
            self._analyze_pattern(test_submission)
        else:
            test_submission.status = TestSubmission.IN_PROGRESS
            test_submission.save()


    def _analyze_pattern(self, test_submission):
        """
        Analyze navigation pattern and create/update summary
        """
        from test_manager.models import TestNavigationHistory, TestPatternSummary
        
        # Get all navigation history for this submission
        navigations = TestNavigationHistory.objects.filter(
            test_submission=test_submission
        ).order_by('timestamp')
        
        if navigations.count() < 3:
            return  # Need at least 3 navigations to analyze
        
        # Initialize counters
        sequential_count = 0
        jump_count = 0
        back_and_forth_count = 0
        total_revisits = 0
        revisits_per_question = defaultdict(int)
        sections_skipped = 0
        reviews = 0
        total_time_before_nav = 0
        
        prev_question = None
        visited_questions = set()
        
        for nav in navigations:
            # Count navigation types
            if nav.action_type == 'NEXT':
                sequential_count += 1
            elif nav.action_type == 'PREVIOUS':
                back_and_forth_count += 1
            elif nav.action_type == 'JUMP':
                jump_count += 1
            elif nav.action_type == 'SECTION_SKIP':
                sections_skipped += 1
            elif nav.action_type == 'REVIEW':
                reviews += 1
            
            # Track revisits
            if nav.to_question_id:
                if nav.to_question_id in visited_questions:
                    total_revisits += 1
                    revisits_per_question[nav.to_question_id] += 1
                else:
                    visited_questions.add(nav.to_question_id)
            
            # Track time
            total_time_before_nav += nav.time_spent_on_previous_question
            prev_question = nav.to_question_id
        
        # Determine primary pattern
        total_nav = navigations.count()
        sequential_percent = (sequential_count / total_nav) * 100
        jump_percent = (jump_count / total_nav) * 100
        back_forth_percent = (back_and_forth_count / total_nav) * 100
        
        if sequential_percent > 60:
            primary_pattern = TestPatternSummary.PATTERN_SEQUENTIAL
        elif back_forth_percent > 40:
            primary_pattern = TestPatternSummary.PATTERN_BACK_AND_FORTH
        elif jump_percent > 40:
            primary_pattern = TestPatternSummary.PATTERN_JUMPING
        else:
            primary_pattern = TestPatternSummary.PATTERN_MIXED
        
        # Calculate efficiency score (higher is better)
        efficiency_score = 0
        if primary_pattern == TestPatternSummary.PATTERN_SEQUENTIAL:
            efficiency_score = 85 + (sequential_percent - 60) * 0.3
        elif primary_pattern == TestPatternSummary.PATTERN_JUMPING:
            efficiency_score = 60 + (100 - jump_percent) * 0.3
        elif primary_pattern == TestPatternSummary.PATTERN_BACK_AND_FORTH:
            efficiency_score = 40 + (100 - back_forth_percent) * 0.4
        else:
            efficiency_score = 50
        
        efficiency_score = min(100, max(0, efficiency_score))
        
        # Calculate time management score
        avg_time = total_time_before_nav / total_nav if total_nav > 0 else 0
        # Ideal time per question is around 60 seconds
        time_score = 100 - max(0, (avg_time - 60) / 60 * 10)  # 10% penalty per 60 seconds over
        time_score = max(0, min(100, time_score))
        
        # Create or update summary
        summary, created = TestPatternSummary.objects.get_or_create(
            student=test_submission.student,
            test_submission=test_submission,
            defaults={
                'primary_pattern': primary_pattern,
                'total_navigations': total_nav,
                'sequential_moves': sequential_count,
                'jump_moves': jump_count,
                'back_and_forth_moves': back_and_forth_count,
                'total_revisits': total_revisits,
                'avg_revisits_per_question': total_revisits / len(visited_questions) if visited_questions else 0,
                'avg_time_before_navigation': int(avg_time),
                'sections_skipped': sections_skipped,
                'questions_marked_for_review': reviews,
                'review_visit_count': reviews,
                'navigation_efficiency_score': round(efficiency_score, 2),
                'time_management_score': round(time_score, 2),
            }
        )
        
        if not created:
            # Update existing summary
            summary.primary_pattern = primary_pattern
            summary.total_navigations = total_nav
            summary.sequential_moves = sequential_count
            summary.jump_moves = jump_count
            summary.back_and_forth_moves = back_and_forth_count
            summary.total_revisits = total_revisits
            summary.avg_revisits_per_question = total_revisits / len(visited_questions) if visited_questions else 0
            summary.avg_time_before_navigation = int(avg_time)
            summary.sections_skipped = sections_skipped
            summary.questions_marked_for_review = reviews
            summary.review_visit_count = reviews
            summary.navigation_efficiency_score = round(efficiency_score, 2)
            summary.time_management_score = round(time_score, 2)
            summary.save()
    



    @action(detail=True, methods=["POST"], url_path="sync-time")
    def sync_time(self, request, pk=None):
        test_submission_id = request.data.get("test_submission_id")
        course_subject = request.data.get("course_subject_id")
        section_id = request.data.get("section_id")
        time_taken = int(request.data.get("time_taken", 0))

        print("\n================ SYNC-TIME =================")
        print("Submission :", test_submission_id)
        print("Course     :", course_subject)
        print("Section    :", section_id)
        print("Client Time:", time_taken)

        result = Result.objects.filter(
            test_submission_id=test_submission_id
        ).first()

        if not result:
            print("❌ Result not found")
            return get_error_response(message="Result not found.")

        section_stats = SectionStats.objects.filter(
            result=result,
            course_subject_id=course_subject,
            section_id=section_id,
        ).first()

        if not section_stats:
            print("❌ SectionStats not found")
            return get_error_response(message="Section stats not found.")

        print("--------- BEFORE UPDATE ---------")
        print("DB time_taken :", section_stats.time_taken)
        print("started_at    :", section_stats.started_at)
        print("last_sync_at  :", section_stats.last_sync_at)

        if time_taken > section_stats.time_taken:
            print(f"Updating DB time {section_stats.time_taken} -> {time_taken}")
            section_stats.time_taken = time_taken
        else:
            print("No update required")

        section_stats.last_sync_at = timezone.now()

        section_stats.save(update_fields=[
            "time_taken",
            "last_sync_at",
        ])

        section_stats.refresh_from_db()

        print("--------- AFTER UPDATE ---------")
        print("DB time_taken :", section_stats.time_taken)
        print("started_at    :", section_stats.started_at)
        print("last_sync_at  :", section_stats.last_sync_at)
        print("================================\n")

        return Response(
            {
                "success": True,
                "time_taken": section_stats.time_taken,
                "last_sync_at": section_stats.last_sync_at,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['POST'], url_path='skip-section')
    def skip_section(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.data.get('test_submission_id')
        section_id = request.data.get('section_id')
        course_subject_id = request.data.get('course_subject_id')

        print(
    "SKIP REQUEST =>",
    "course_subject_id=", course_subject_id,
    "section_id=", section_id
)

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
            defaults={
                "time_taken": 0,
                "started_at": timezone.now(),
                "last_sync_at": timezone.now(),
                "total_questions": len(question_ids),
            },
        )

        # Ensure total_questions is correctly set
        section_stats.total_questions = len(question_ids)
        section_stats.save()

        # Check if the test is completed
        # all_answered = QuestionAnswer.objects.filter(result=result).count() >= \
        #                sum([stats.total_questions for stats in SectionStats.objects.filter(result=result)])

        # if all_answered:
        #     test_submission.status = TestSubmission.COMPLETED
        #     test_submission.completion_date = timezone.now()
        #     mark_notification_as_read.delay(user_id=test_submission.student.id, category=Notification.TEST,
        #                                     reference_id=test_submission.id)
        # else:
        #     test_submission.status = TestSubmission.IN_PROGRESS

        # Save the test submission status


        sections = list(Section.objects.filter(test=test))

        all_sections = []

        for sec in sections:
            for sub_sec in sec.sub_sections:
                all_sections.append({
                    "course_subject_id": sec.course_subject_id,
                    "section_id": int(sub_sec["id"])
                })

        current_index = None

        for idx, item in enumerate(all_sections):
            if (
                str(item["course_subject_id"]) == str(course_subject_id)
                and
                str(item["section_id"]) == str(section_id)
            ):
                current_index = idx
                break

        if current_index is not None:

            next_index = current_index + 1

            if next_index < len(all_sections):

                next_section = all_sections[next_index]

                test_submission.current_course_subject_id = (
                    next_section["course_subject_id"]
                )

                test_submission.current_section_id = (
                    next_section["section_id"]
                )

                test_submission.current_section_started_at = timezone.now()

                print(
                    "NEXT SECTION =>",
                    next_section["course_subject_id"],
                    next_section["section_id"]
                )

            else:
                print("TEST COMPLETED")

                # Final section completed
                test_submission.current_course_subject_id = None
                test_submission.current_section_id = None
                test_submission.status = TestSubmission.COMPLETED
                test_submission.completion_date = timezone.now()
                test_submission.save()

                send_test_completion_email.delay(test_submission.id)

                mark_notification_as_read.delay(
                    user_id=test_submission.student.id,
                    category=Notification.TEST,
                    reference_id=test_submission.id,
                )
                return Response({
                    "detail": "Test completed.",
                    "completed": True,
                    "next_course_subject_id": None,
                    "next_section_id": None,
                }, status=status.HTTP_200_OK)
        test_submission.save()
        result.save()

        return Response({"detail": "Section marked as completed.","next_course_subject_id": next_section["course_subject_id"],
    "next_section_id": next_section["section_id"],}, status=status.HTTP_200_OK)


    @action(detail=True, methods=['POST'], url_path='exit-test')
    def exit_test(self, request, pk=None, *args, **kwargs):
        test_submission_id = request.data.get("test_submission_id")

        try:
            test_submission = TestSubmission.objects.get(id=test_submission_id)
        except TestSubmission.DoesNotExist:
            return get_error_response(message="Test submission not found.")

        test = test_submission.test

        result, _ = Result.objects.get_or_create(
            test_submission=test_submission,
            defaults={
                "correct_answer_count": 0,
                "incorrect_answer_count": 0,
                "time_taken": 0,
                "detailed_view": {},
            }
        )

        sections = Section.objects.filter(test=test)

        # Mark every unanswered question as skipped
        for section in sections:
            for sub_section in section.sub_sections:

                if test.format_type == Test.DYNAMIC:
                    section_key = f"{section.course_subject_id}_{sub_section['id']}"
                    question_ids = test_submission.selected_question_ids.get(
                        section_key,
                        []
                    )
                else:
                    question_ids = sub_section["questions"]

                questions = Question.objects.filter(id__in=question_ids)

                for question in questions:
                    QuestionAnswer.objects.get_or_create(
                        result=result,
                        course_subject_id=section.course_subject_id,
                        section_id=sub_section["id"],
                        question=question,
                        defaults={
                            "is_correct": False,
                            "is_skipped": True,
                            "time_taken": 0,
                            "selected_options": [],
                            "times_visited": 1,
                            "first_time_taken": 0,
                            "is_marked_for_review": False,
                            "order": result.get_question_order(
                                test,
                                section.course_subject_id,
                                sub_section["id"],
                                question.id
                            )
                        }
                    )

                # Ensure SectionStats exists
                SectionStats.objects.get_or_create(
                    result=result,
                    course_subject_id=section.course_subject_id,
                    section_id=sub_section["id"],
                    defaults={
                        "time_taken": 0,
                        "total_questions": len(question_ids)
                    }
                )

        # Recalculate counts
        result.correct_answer_count = QuestionAnswer.objects.filter(
            result=result,
            is_correct=True
        ).count()

        result.incorrect_answer_count = QuestionAnswer.objects.filter(
            result=result,
            is_correct=False
        ).count()

        result.save()

        # Complete test
        test_submission.status = TestSubmission.COMPLETED
        test_submission.completion_date = timezone.now()
        test_submission.current_course_subject_id = None
        test_submission.current_section_id = None
        test_submission.current_section_started_at = None
        test_submission.save()

        mark_notification_as_read.delay(
            user_id=test_submission.student.id,
            category=Notification.TEST,
            reference_id=test_submission.id,
        )

        return Response(
            {
                "detail": "Test exited successfully.",
                "status": TestSubmission.COMPLETED,
            },
            status=status.HTTP_200_OK,
        )



    

    @action(detail=True, methods=['GET'], url_path='test-progress')
    def get_test_progress(self, request, pk=None, *args, **kwargs):
        test = Test.get_test_by_id(test_id=pk)
        test_submission_id = request.query_params.get('test_submission_id')

        test_submission = TestSubmission.objects.get(id=test_submission_id)
        if not test_submission:
            return get_error_response(message='Test submission not found.')

        sections = Section.objects.filter(test=test)
        serialized_sections = SectionSerializer(sections, many=True).data

        result = Result.objects.filter(
            test_submission=test_submission
        ).first()
        print(
        "TEST PROGRESS",
        "current_course_subject_id=",
        test_submission.current_course_subject_id,
        "current_section_id=",
        test_submission.current_section_id,
    )

        if not result:
            print("NO RESULT FOUND")

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


        # =====================================================
        # RESTORE CURRENT ACTIVE SECTION FROM DB
        # =====================================================

        if (
            test_submission.current_course_subject_id
            and test_submission.current_section_id
        ):
            current_course_subject_id = test_submission.current_course_subject_id
            current_section_id = test_submission.current_section_id

            for course_subject_idx, section in enumerate(sections):

                if str(section.course_subject_id) != str(current_course_subject_id):
                    continue

                sub_section = next(
                    (
                        s for s in section.sub_sections
                        if str(s["id"]) == str(current_section_id)
                    ),
                    None
                )

                if not sub_section:
                    continue

                # ------------------------------
                # Question IDs
                # ------------------------------
                if test.format_type == Test.DYNAMIC:
                    section_key = (
                        f"{section.course_subject_id}_{sub_section['id']}"
                    )

                    question_ids = test_submission.selected_question_ids.get(
                        section_key,
                        []
                    )
                else:
                    question_ids = sub_section["questions"]

                # ------------------------------
                # Answers
                # ------------------------------
                question_answers = QuestionAnswer.objects.filter(
                    result=result,
                    course_subject_id=section.course_subject_id,
                    section_id=sub_section["id"],
                    question_id__in=question_ids
                )

                question_answer_map = {
                    qa.question_id: qa
                    for qa in question_answers
                }

                answer_map = {}

                for qid in question_ids:

                    qa = question_answer_map.get(qid)

                    if qa:
                        selected_options = {}
                        gridin_answer = ""

                        # GRID-IN answer stored as string
                        if isinstance(qa.selected_options, str):
                            gridin_answer = qa.selected_options

                        # GRID-IN stored as ["10"]
                        elif (
                            isinstance(qa.selected_options, list)
                            and len(qa.selected_options) == 1
                            and isinstance(qa.selected_options[0], str)
                        ):
                            gridin_answer = qa.selected_options[0]

                        # MCQ
                        elif isinstance(qa.selected_options, list):
                            selected_options = {
                                str(i): 1
                                for i in qa.selected_options
                            }

                        answer_map[str(qid)] = {
                            "selected_options": selected_options,
                            "gridinAnswer": gridin_answer,
                            "striked_options": {
                                str(i): 1 for i in qa.striked_options
                            },
                            "selectionHistory": [],
                            "is_marked_for_review": qa.is_marked_for_review,
                            "is_answered": not qa.is_skipped,
                        }

                    else:
                        answer_map[str(qid)] = {
                            "selected_options": {},
                            "gridinAnswer": "",
                            "striked_options": {},
                            "is_marked_for_review": False,
                            "is_answered": False,
                        }

                # ------------------------------
                # FIND CURRENT QUESTION
                # ------------------------------
                current_question_id = (
                    question_ids[0]
                    if question_ids else 0
                )

                current_question_index = 0

                for idx, qid in enumerate(question_ids):
                    if qid not in question_answer_map:
                        current_question_id = qid
                        current_question_index = idx
                        break

                # ------------------------------
                # TIMER RESTORE
                # ------------------------------
                section_stats = SectionStats.objects.filter(
                    result=result,
                    course_subject_id=section.course_subject_id,
                    section_id=sub_section["id"],
                ).first()

                duration_seconds = sub_section["duration"] * 60

                print("\n================ RESTORE TIMER ================")
                print("NOW               :", timezone.now())
                print("Submission        :", test_submission.id)
                print("Course Subject    :", section.course_subject_id)
                print("Section           :", sub_section["id"])
                print("Duration (sec)    :", duration_seconds)

                if section_stats:
                    print("SectionStats ID   :", section_stats.id)
                    print("DB time_taken     :", section_stats.time_taken)
                    print("started_at        :", section_stats.started_at)
                    print("last_sync_at      :", section_stats.last_sync_at)

                    if section_stats.time_taken is not None:
                        stored_time = section_stats.time_taken
                    else:
                        stored_time = 0
                else:
                    print("SectionStats      : NOT FOUND")
                    stored_time = 0

                remaining_time = max(
                    duration_seconds - stored_time,
                    0,
                )

                print("----------------------------------------------")
                print("Stored Time       :", stored_time)
                print("Remaining Time    :", remaining_time)
                print("Question Count    :", len(question_ids))
                print("Current Question  :", current_question_id)
                print("Current Index     :", current_question_index)
                print("==============================================\n")

               
                

               
                print("NOW:", timezone.now())
               
                print(
                    "RESTORE ACTIVE SECTION =>",
                    "course_subject=", section.course_subject_id,
                    "section=", sub_section["id"],
                    "question=", current_question_id,
                    "question_index=", current_question_index,
                    "remaining_time=", remaining_time,
                )
                print(
    "RETURNING",
    section.course_subject_id,
    sub_section["id"]
)               

                print("RETURN RESPONSE =>", {
    "course_subject_id": section.course_subject_id,
    "section_id": sub_section["id"],
    "remaining_time": remaining_time,
    "question_id": current_question_id,
    "question_index": current_question_index,
})    

                return Response({
                    "test_id": test.id,
                    "test_name": test.name,
                    "course_name": test.course.name,
                    "course_subject_id": section.course_subject_id,
                    "subject": serialized_sections,
                    "course_subject_index": course_subject_idx,
                    "section_id": sub_section["id"],
                    "section_index": 0,
                    "remaining_time": remaining_time,
                    "question_id": current_question_id,
                    "question_index": current_question_index,
                    "answer_map": answer_map
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
            section_changed = (
                test_submission.current_course_subject_id != int(course_subject_id)
                or
                test_submission.current_section_id != int(section_id)
            )

            test_submission.current_course_subject_id = int(course_subject_id)
            test_submission.current_section_id = int(section_id)

            if section_changed:
                test_submission.current_section_started_at = timezone.now()
            
            # ✅ Mark test as started as soon as student enters it
            if test_submission.status == TestSubmission.YET_TO_START:
                test_submission.status = TestSubmission.IN_PROGRESS

            test_submission.save(
                update_fields=[
                    "current_course_subject_id",
                    "current_section_id",
                    "current_section_started_at"
                ]
            )
            result, _ = Result.objects.get_or_create(
                test_submission=test_submission,
                defaults={
                    "correct_answer_count": 0,
                    "incorrect_answer_count": 0,
                    "time_taken": 0,
                    "detailed_view": {}
                }
            )

            section_stats, created = SectionStats.objects.get_or_create(
                result=result,
                course_subject_id=course_subject_id,
                section_id=section_id,
                defaults={
                    "time_taken": 0,
                    "started_at": timezone.now(),
                     "last_sync_at": timezone.now(),
                    "total_questions": 0
                }
            )

            if not section_stats.started_at:
                section_stats.started_at = timezone.now()
                section_stats.save(update_fields=["started_at"])
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
                    excluded_question_ids = self.get_all_used_question_ids(
                        test_submission.student,
                        course_subject_id
                    )

                    question_ids = self.select_questions_for_section(
                        course_subject_id, section, section_id,
                        sub_section, test, test_submission,
                        excluded_question_ids=excluded_question_ids
                    )

                    # RC last
                    question_objs = Question.objects.filter(id__in=question_ids)
                    rc_questions = [q.id for q in question_objs if q.question_subtype == "READING_COMPREHENSION"]
                    other_questions = [q.id for q in question_objs if q.question_subtype != "READING_COMPREHENSION"]
                    question_ids = other_questions + rc_questions

                    # Save
                    test_submission.selected_question_ids[section_key] = question_ids
                    test_submission.save()

                    # ✅ FIXED
                    answered_questions, _ = AnsweredQuestions.objects.get_or_create(
                        student=test_submission.student,
                        course_subject_id=course_subject_id
                    )
                    answered_questions.questions = list(
                        set(answered_questions.questions + question_ids)
                    )
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
                    
                    section_stats, created = SectionStats.objects.get_or_create(
                        result=result,
                        course_subject_id=course_subject_id,
                        section_id=section_id,
                        defaults={
                            "time_taken": 0,
                             "last_sync_at": timezone.now(),
                            "started_at": timezone.now()
                        }
                    )

                    if created:
                        section_stats.total_questions = len(question_ids)
                        section_stats.save()
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


    def get_all_used_question_ids(self, student, course_subject_id):
        used_ids = set()

        # 1️⃣ Full length tests
        qa_ids = QuestionAnswer.objects.filter(
            result__test_submission__student=student,
            course_subject_id=course_subject_id
        ).values_list('question_id', flat=True)
        used_ids.update(qa_ids)

        # 2️⃣ Practice tests
        pqa_ids = PracticeQuestionAnswer.objects.filter(
            practice_test_result__practice_test__student=student,
            practice_test_result__practice_test__course_subject_id=course_subject_id
        ).values_list('question_id', flat=True)
        used_ids.update(pqa_ids)

        # 3️⃣ Cache table
        try:
            aq = AnsweredQuestions.objects.get(
                student=student,
                course_subject_id=course_subject_id
            )
            used_ids.update(aq.questions)
        except AnsweredQuestions.DoesNotExist:
            pass

        # 4️⃣ From selected_question_ids (via Section → Test)
        submissions = TestSubmission.objects.filter(
            student=student,
            test__in=Section.objects.filter(
                course_subject_id=course_subject_id
            ).values_list('test_id', flat=True)
        )

        for sub in submissions:
            for q_list in sub.selected_question_ids.values():
                used_ids.update(q_list)

        return list(used_ids)



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

    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAdmin],
    url_path="assignable"
)
    def assignable(self, request):
        course_id = request.query_params.get("course_id")
        student_id = request.query_params.get("student_id")

        qs = Test.objects.filter(is_active=True)

        if course_id:
            qs = qs.filter(course_id=course_id)

        # Only tests from enrolled courses
        if student_id:
            enrolled_courses = CourseEnrollment.objects.filter(
                student_id=student_id
            ).values_list("course_id", flat=True)

            qs = qs.filter(course_id__in=enrolled_courses)

            # Exclude already assigned tests
            assigned_test_ids = TestSubmission.objects.filter(
                student_id=student_id
            ).values_list("test_id", flat=True)
            

            qs = qs.exclude(id__in=assigned_test_ids)

        serializer = TestListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(
    detail=False,
    methods=["POST"],
    permission_classes=[IsAdmin],
    url_path="assign"
)
    def assign(self, request):
        student_id = request.data.get("student_id")
        test_ids = request.data.get("test_ids", [])
        expiration_days = int(request.data.get("expiration_days", 7))

        if not student_id or not test_ids:
            return Response(
                {"detail": "student_id and test_ids are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        assigned_date = timezone.now()
        expiration_date = assigned_date + timedelta(days=expiration_days)

        assigned = []
        skipped = []

        for test_id in test_ids:
            try:
                test = Test.objects.get(id=test_id)
            except Test.DoesNotExist:
                skipped.append({
                    "test_id": test_id,
                    "reason": "Test not found"
                })
                continue

            # 🔥 STEP 1: Check student enrolled in test course
            is_enrolled = CourseEnrollment.objects.filter(
                student=student,
                course=test.course
            ).exists()

            if not is_enrolled:
                skipped.append({
                    "test_id": test_id,
                    "test_name": test.name,
                    "reason": "Student not enrolled in this course"
                })
                continue

            # 🚫 STEP 2: Prevent duplicate assignment / already attempted
            if TestSubmission.objects.filter(
                student=student,
                test=test,
                status__in=[
                    TestSubmission.YET_TO_START,
                    TestSubmission.IN_PROGRESS,
                    TestSubmission.COMPLETED,
                ]
            ).exists():
                skipped.append({
                    "test_id": test_id,
                    "test_name": test.name,
                    "reason": "Already assigned or completed"
                })
                continue

            # ✅ STEP 3: Assign test
            TestSubmission.objects.create(
                student=student,
                test=test,
                assigned_date=assigned_date,
                expiration_date=expiration_date,
                status=TestSubmission.YET_TO_START
            )

            assigned.append({
                "test_id": test.id,
                "test_name": test.name
            })

        return Response(
            {
                "assigned": assigned,
                "skipped": skipped,
                "assigned_count": len(assigned),
                "skipped_count": len(skipped),
            },
            status=status.HTTP_201_CREATED if assigned else status.HTTP_400_BAD_REQUEST
        )

    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAuthenticated],
    url_path='performance-visualization'
)
    def performance_visualization(self, request):

        student_id = request.query_params.get("student_id")

        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        now = timezone.now()
        last_week = now - timedelta(days=7)
        previous_week = now - timedelta(days=14)

        # ✅ ONLY COMPLETED FULL TESTS
        answers = QuestionAnswer.objects.filter(
            result__test_submission__student_id=student_id,
            result__test_submission__status=TestSubmission.COMPLETED
        ).select_related(
            "question",
            "question__topic",
            "question__sub_topic",
            "course_subject__subject",
            "result"
        )

        topic_map = defaultdict(lambda: {
            "attempted": 0,
            "correct": 0,
            "total_time": 0,
            "subject": "",
            "topic": "",
            "sub_topic": "",
        })

        total_time = 0
        total_attempts = 0

        correct_last_week = 0
        attempts_last_week = 0

        correct_previous_week = 0
        attempts_previous_week = 0

        # ==============================
        # LOOP THROUGH ANSWERS
        # ==============================

        for ans in answers:

            if not ans.question.topic:
                continue

            topic = ans.question.topic
            sub_topic = ans.question.sub_topic
            sub_topic_name = sub_topic.name if sub_topic else "General"

            key = f"{topic.name}-{sub_topic_name}"

            topic_map[key]["topic"] = topic.name
            topic_map[key]["sub_topic"] = sub_topic_name
            topic_map[key]["subject"] = (
                ans.course_subject.subject.name
                if ans.course_subject else ""
            )

            topic_map[key]["attempted"] += 1
            topic_map[key]["total_time"] += ans.time_taken or 0

            total_attempts += 1
            total_time += ans.time_taken or 0

            if ans.is_correct:
                topic_map[key]["correct"] += 1

            # -------- Weekly Trend --------
            if ans.result.created_at >= last_week:
                attempts_last_week += 1
                if ans.is_correct:
                    correct_last_week += 1

            elif previous_week <= ans.result.created_at < last_week:
                attempts_previous_week += 1
                if ans.is_correct:
                    correct_previous_week += 1

        # ==============================
        # BUILD WEAK TOPICS (≤ 39%)
        # ==============================

        weak_topics = []

        for data in topic_map.values():

            if data["attempted"] == 0:
                continue

            accuracy = round(
                (data["correct"] / data["attempted"]) * 100,
                2
            )

            avg_time = round(
                data["total_time"] / data["attempted"]
            )

            # ✅ Weak threshold updated to match grading system
            if accuracy <= 39:
                weak_topics.append({
                    "topic": data["topic"],
                    "sub_topic": data["sub_topic"],
                    "subject": data["subject"],
                    "accuracy": accuracy,
                    "attempted": data["attempted"],
                    "avg_time": avg_time,
                })

        weak_topics.sort(key=lambda x: x["accuracy"])

        # ==============================
        # PERFORMANCE TREND %
        # ==============================

        acc_last_week = (
            (correct_last_week / attempts_last_week) * 100
            if attempts_last_week > 0 else 0
        )

        acc_previous_week = (
            (correct_previous_week / attempts_previous_week) * 100
            if attempts_previous_week > 0 else 0
        )

        performance_trend = round(acc_last_week - acc_previous_week)

        # ==============================
        # TIME OVERAGE % (NO NEGATIVE)
        # ==============================

        avg_time_all = (
            total_time / total_attempts
            if total_attempts > 0 else 0
        )

        ideal_time = 60

        raw_overage = (
            ((avg_time_all - ideal_time) / ideal_time) * 100
            if ideal_time > 0 else 0
        )

        # Never allow negative overage
        time_overage_percent = round(raw_overage) if raw_overage > 0 else 0

        # ==============================
        # FINAL RESPONSE
        # ==============================

        return Response({
            "topics": weak_topics,
            "pro_tip": "Topics below 40% need immediate attention.",
            "performance_trend": performance_trend,        # can be negative
            "time_overage_percent": time_overage_percent,  # never negative
        })

    @action(detail=False, methods=["get"], url_path="detailed-topic-analysis")
    def detailed_topic_analysis(self, request):
        student_id = request.GET.get("student_id")

        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        # 🔥 Correct Join Chain (VERY IMPORTANT)
        answers = (
            QuestionAnswer.objects.filter(
                result__test_submission__student_id=student_id
            )
            .select_related(
                "question",
                "question__topic",
                "question__sub_topic",
                "course_subject",
                "course_subject__subject",
                "result",
                "result__test_submission",
            )
        )

        topic_map = {}

        for ans in answers:
            question = ans.question
            topic = getattr(question, "topic", None)
            sub_topic = getattr(question, "sub_topic", None)

            if not topic:
                continue

            topic_name = topic.name
            sub_topic_name = sub_topic.name if sub_topic else "General"

            # 🔥 Merge by NAME (not ID)
            key = f"{topic_name}-{sub_topic_name}"

            if key not in topic_map:
                topic_map[key] = {
                    "id": key,
                    "topic": topic_name,
                    "sub_topic": sub_topic_name,
                    "subject": ans.course_subject.subject.name if ans.course_subject else "",
                    "attempted": 0,
                    "correct": 0,
                    "accuracy": 0,
                    "avg_time": 0,
                    "ideal_time": 60,
                    "repeated_mistakes": 0,
                    "difficulty": question.difficulty,
                    "last_attempted": ans.result.created_at,
                    "total_time": 0,  # internal field
                }

            topic_map[key]["attempted"] += 1
            topic_map[key]["total_time"] += ans.time_taken or 0

            if ans.is_correct:
                topic_map[key]["correct"] += 1
            else:
                topic_map[key]["repeated_mistakes"] += 1

            # keep latest attempt date
            if ans.result.created_at > topic_map[key]["last_attempted"]:
                topic_map[key]["last_attempted"] = ans.result.created_at

        # 🔥 Final Calculations
        results = []

        for data in topic_map.values():
            if data["attempted"] > 0:
                data["accuracy"] = round(
                    (data["correct"] / data["attempted"]) * 100
                )

                # Weighted average time
                data["avg_time"] = round(
                    data["total_time"] / data["attempted"]
                )

            # Weak Topic Flag
            data["is_weak"] = data["accuracy"] < 40

            # Format date
            data["last_attempted"] = data["last_attempted"].isoformat()

            # Remove internal field
            del data["total_time"]

            results.append(data)

        # 🔥 Sort by weakest first
        results.sort(key=lambda x: x["accuracy"])

        return Response(results)
    
    @action(detail=False, methods=["get"], url_path="topic-question-analysis")
    def topic_question_analysis(self, request):
        student_id = request.GET.get("student_id")
        topic_name = request.GET.get("topic")
        sub_topic_name = request.GET.get("sub_topic")

        if not student_id or not topic_name:
            return Response(
                {"error": "student_id and topic are required"},
                status=400
            )

        submissions = TestSubmission.objects.filter(
            student_id=student_id,
            status=TestSubmission.COMPLETED
        ).select_related("test", "result")

        data = []
        modal_counter = 1

        for submission in submissions:
            result = submission.result
            test = submission.test

            if not result:
                continue

            sections = Section.objects.filter(test=test).order_by("order")

            for section in sections:
                for sub_section in section.sub_sections:

                    section_id = sub_section.get("id")
                    section_key = f"{section.course_subject.id}_{section_id}"

                    # Get question IDs in correct test order
                    if section_key in submission.selected_question_ids:
                        question_ids = submission.selected_question_ids[section_key]
                    else:
                        question_ids = sub_section.get("questions", [])

                    # Convert section id → A/B/C
                    section_label = chr(64 + int(section_id)) if section_id else "A"

                    for index, qid in enumerate(question_ids):

                        question = Question.objects.filter(
                            id=qid
                        ).select_related("topic", "sub_topic").first()

                        if not question or not question.topic:
                            continue

                        # Filter by topic
                        if question.topic.name != topic_name:
                            continue

                        # Filter by sub_topic (if provided)
                        if sub_topic_name:
                            if not question.sub_topic or question.sub_topic.name != sub_topic_name:
                                continue

                        qa = QuestionAnswer.objects.filter(
                            result=result,
                            question_id=qid
                        ).first()

                        # Determine status
                        if not qa:
                            status = "Skipped"
                        elif qa.is_skipped:
                            status = "Skipped"
                        elif qa.is_correct:
                            status = "Correct"
                        else:
                            status = "Incorrect"

                        real_sr_no = index + 1  # position inside test

                        data.append({
                            "id": qa.id if qa else None,
                            "question_number": modal_counter,        # 1,2,3...
                            "test_sr_no": real_sr_no,               # actual test position
                            "section": section_label,               # A/B
                            "question_text": f"{question.topic.name}"
                                            f"{' - ' + question.sub_topic.name if question.sub_topic else ''}",
                            "test_name": test.name,
                            "status": status,
                            "time_taken": qa.time_taken if qa else 0,
                            "date": submission.assigned_date.strftime("%d %b %Y"),
                        })

                        modal_counter += 1

        return Response(data)

    
    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="smart-insights"
)
    def smart_insights(self, request):

        student_id = request.query_params.get("student_id")

        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        # ======================================================
        # 🔹 FULL TEST ONLY (Analytics Rule)
        # ======================================================

        answers = QuestionAnswer.objects.filter(
            result__test_submission__student_id=student_id,
            result__test_submission__status=TestSubmission.COMPLETED
        ).select_related(
            "question",
            "question__topic",
            "question__sub_topic",
            "course_subject__subject"
        )

        if not answers.exists():
            return Response({
                "focus_this_week": [],
                "quick_wins": [],
                "pattern_detected": {
                    "hard_accuracy": 0,
                    "hard_total": 0
                },
                "time_management": {
                    "average_time": 0,
                    "overage_percent": 0
                },
                "recommendation": {
                    "focus_count": 0
                }
            })

        # ======================================================
        # 🔹 BUILD TOPIC MAP
        # ======================================================

        topic_map = defaultdict(lambda: {
            "topic": "",
            "sub_topic": "",
            "subject": "",
            "attempted": 0,
            "correct": 0,
            "total_time": 0,
            "difficulty_counts": defaultdict(int),
        })

        for ans in answers:

            if not ans.question.topic:
                continue

            topic_name = ans.question.topic.name
            sub_topic_name = ans.question.sub_topic.name if ans.question.sub_topic else "General"
            subject_name = ans.course_subject.subject.name if ans.course_subject else ""

            key = (topic_name, sub_topic_name)

            topic_map[key]["topic"] = topic_name
            topic_map[key]["sub_topic"] = sub_topic_name
            topic_map[key]["subject"] = subject_name
            topic_map[key]["attempted"] += 1
            topic_map[key]["total_time"] += ans.time_taken or 0
            topic_map[key]["difficulty_counts"][ans.question.difficulty] += 1

            if ans.is_correct:
                topic_map[key]["correct"] += 1

        # ======================================================
        # 🔹 CALCULATE ACCURACY + AVG TIME
        # ======================================================

        results = []

        for data in topic_map.values():

            if data["attempted"] == 0:
                continue

            accuracy = round(
                (data["correct"] / data["attempted"]) * 100
            )

            avg_time = round(
                data["total_time"] / data["attempted"]
            )

            data["accuracy"] = accuracy
            data["avg_time"] = avg_time

            results.append(data)

        # ======================================================
        # 1️⃣ FOCUS THIS WEEK (<40%)
        # ======================================================

        weak_topics = sorted(
            [t for t in results if t["accuracy"] < 40],
            key=lambda x: x["accuracy"]
        )[:3]

        # ======================================================
        # 2️⃣ QUICK WINS (60–70%)
        # ======================================================

        quick_wins = sorted(
            [t for t in results if 60 <= t["accuracy"] < 70],
            key=lambda x: -x["accuracy"]
        )[:3]

        # ======================================================
        # 3️⃣ PATTERN DETECTED (HARD QUESTIONS)
        # ======================================================

        hard_answers = answers.filter(question__difficulty="HARD")

        hard_total = hard_answers.count()
        hard_correct = hard_answers.filter(is_correct=True).count()

        hard_accuracy = round(
            (hard_correct / hard_total) * 100
        ) if hard_total > 0 else 0

        pattern_detected = {
            "hard_accuracy": hard_accuracy,
            "hard_total": hard_total
        }

        # ======================================================
        # 4️⃣ TIME MANAGEMENT (NO NEGATIVE %)
        # ======================================================

        avg_time_all = answers.aggregate(
            avg_time=Avg("time_taken")
        )["avg_time"] or 0

        ideal_time = 60

        raw_overage = (
            ((avg_time_all - ideal_time) / ideal_time) * 100
            if ideal_time > 0 else 0
        )

        # 🔥 IMPORTANT FIX → No Negative Values
        time_overage = round(raw_overage) if raw_overage > 0 else 0

        time_management = {
            "average_time": round(avg_time_all),
            "overage_percent": time_overage
        }

        # ======================================================
        # 5️⃣ RECOMMENDATION
        # ======================================================

        recommendation = {
            "focus_count": len(weak_topics)
        }

        # ======================================================
        # FINAL RESPONSE
        # ======================================================

        return Response({
            "focus_this_week": weak_topics,
            "quick_wins": quick_wins,
            "pattern_detected": pattern_detected,
            "time_management": time_management,
            "recommendation": recommendation
        })
    
    



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
            'subjects': [],
            'navigation_pattern': self._get_navigation_pattern_summary(test_submission),
            'test_taking_behavior': self._analyze_test_behavior(test_submission, result)
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

                    # Fetch navigation history for this section
                    navigation_history_qs = TestNavigationHistory.objects.filter(
                        test_submission=test_submission,
                        current_section_id=sub_section['id']
                    ).order_by('timestamp').values(
                        'action_type', 'timestamp', 'from_question_id', 'to_question_id',
                        'time_spent_on_previous_question', 'current_question_index'
                    )
                    navigation_history = list(navigation_history_qs)

                    self.logger.info(f"✅ Loaded {len(question_map)} Questions, {len(question_answers)} QuestionAnswers, "
                                   f"selection history for {len(selection_map)} questions, "
                                   f"navigation history for {len(navigation_history)} actions")

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
                            'selection_history': q_selection_history,
                            'navigation_actions': self._get_question_navigation_actions(
                                navigation_history, question.id, idx
                            )
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

                    # Get section navigation summary
                    section_navigation_summary = self._get_section_navigation_summary(
                        navigation_history, sub_section['id']
                    )

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
                        'navigation_summary': section_navigation_summary,
                    }
                    
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

            # CombinedScore used for ALL courses
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
                print("score_record.total_score", score_record.total_score)
            response_data['subjects'].append(subject_data)

        response_data['total_score'] = total_score
        self.logger.info(f"✅ Final Total Score: {total_score}")
        return JsonResponse(response_data)

    def _get_navigation_pattern_summary(self, test_submission):
        """
        Get navigation pattern summary for a test submission
        """
        try:
            summary = TestPatternSummary.objects.get(
                test_submission=test_submission
            )
            return {
                'primary_pattern': summary.primary_pattern,
                'navigation_efficiency': summary.navigation_efficiency_score,
                'time_management_score': summary.time_management_score,
                'total_navigations': summary.total_navigations,
                'sequential_moves': summary.sequential_moves,
                'jump_moves': summary.jump_moves,
                'back_and_forth_moves': summary.back_and_forth_moves,
                'total_revisits': summary.total_revisits,
                'avg_revisits_per_question': summary.avg_revisits_per_question,
                'questions_marked_for_review': summary.questions_marked_for_review
            }
        except TestPatternSummary.DoesNotExist:
            return None

    def _analyze_test_behavior(self, test_submission, result):
        """
        Analyze overall test-taking behavior
        """
        # Get all navigation history
        navigations = TestNavigationHistory.objects.filter(
            test_submission=test_submission
        ).order_by('timestamp')
        
        total_navigations = navigations.count()
        
        if total_navigations == 0:
            return None
        
        # Calculate average time per question
        avg_time = 0
        total_time = 0
        count_with_time = 0
        
        for nav in navigations:
            if nav.time_spent_on_previous_question > 0:
                total_time += nav.time_spent_on_previous_question
                count_with_time += 1
        
        avg_time = total_time / count_with_time if count_with_time > 0 else 0
        
        # Count unique questions visited
        visited_questions = set()
        for nav in navigations:
            if nav.to_question_id:
                visited_questions.add(nav.to_question_id)
        
        # Count revisits
        question_visits = defaultdict(int)
        for nav in navigations:
            if nav.to_question_id:
                question_visits[nav.to_question_id] += 1
        
        revisit_count = sum(1 for visits in question_visits.values() if visits > 1)
        avg_visits_per_question = sum(question_visits.values()) / len(question_visits) if question_visits else 0
        
        # Check for patterns
        is_sequential = True
        previous_question = None
        for nav in navigations:
            if nav.action_type == 'JUMP' or (previous_question and nav.to_question_id and 
                                             nav.to_question_id != previous_question + 1):
                is_sequential = False
                break
            previous_question = nav.to_question_id
        
        return {
            'total_navigations': total_navigations,
            'unique_questions_visited': len(visited_questions),
            'total_revisits': revisit_count,
            'avg_visits_per_question': round(avg_visits_per_question, 2),
            'avg_time_per_question': round(avg_time, 2),
            'is_sequential': is_sequential,
            'has_jumps': any(nav.action_type == 'JUMP' for nav in navigations),
            'has_back_and_forth': any(nav.action_type == 'PREVIOUS' for nav in navigations),
            'question_visits': dict(question_visits)
        }

    def _get_question_navigation_actions(self, navigation_history, question_id, question_index):
        """
        Get navigation actions related to a specific question
        """
        actions = []
        for nav in navigation_history:
            # Check if this navigation involves the question
            if nav.get('from_question_id') == question_id or nav.get('to_question_id') == question_id:
                actions.append({
                    'action_type': nav.get('action_type'),
                    'timestamp': nav.get('timestamp').isoformat() if nav.get('timestamp') else None,
                    'from_question': nav.get('from_question_id'),
                    'to_question': nav.get('to_question_id'),
                    'time_spent': nav.get('time_spent_on_previous_question', 0),
                    'question_index': nav.get('current_question_index')
                })
        return actions

    def _get_section_navigation_summary(self, navigation_history, section_id):
        """
        Get navigation summary for a section
        """
        if not navigation_history:
            return {
                'total_actions': 0,
                'action_breakdown': {}
            }
        
        action_breakdown = defaultdict(int)
        for nav in navigation_history:
            action_breakdown[nav.get('action_type', 'UNKNOWN')] += 1
        
        return {
            'total_actions': len(navigation_history),
            'action_breakdown': dict(action_breakdown)
        }

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

    
    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="recent/full-length"
)
    def recent_full_length(self, request):

        limit = int(request.query_params.get("limit", 10))

        submissions = (
        TestSubmission.objects
        .filter(
            test__test_type=Test.EXAM,
            status=TestSubmission.COMPLETED,
            completion_date__isnull=False,
        )
        .select_related(
            "student",
            "test",
            "test__course",
            "result",
        )
        .order_by("-completion_date")[:limit]
    )

        serializer = RecentFullLengthResultSerializer(submissions, many=True)
        return Response(serializer.data)


    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAuthenticated],
    url_path='recent/practice'
)
    def recent_practice(self, request):
        qs = PracticeTest.objects.select_related(
            'student',
            'course_subject__course',
            'result'
        )

        course_id = request.GET.get('course_id')
        student_id = request.GET.get('student_id')
        limit = int(request.GET.get('limit', 10))

        if course_id:
            qs = qs.filter(course_subject__course_id=course_id)
        if student_id:
            qs = qs.filter(student_id=student_id)

        qs = qs.order_by('-created_at')[:limit]

        return Response(RecentPracticeTestSerializer(qs, many=True).data)



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
    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAuthenticated],
    url_path='Topic_Wise_Practice'
)
    def Topic_Wise_Practice(self, request, *args, **kwargs):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type", "all")  # fullLength, practiceTest, all

        if not student_id or not course_id:
            return Response({"error": "student_id and course_id are required"}, status=400)

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)
        course_subjects = CourseSubjects.objects.filter(course=course)

        final_response = []

        for cs in course_subjects:
            
            subject_block = {
                "subject": cs.subject.name,
                "topics": []
            }

            # Get all topics under this subject
            topics = Topic.objects.filter(course_subject=cs)

            for topic in topics:

                # ⭐ Total available DB questions for this topic
                total_questions = Question.objects.filter(
                    course_subject=cs,
                    topic=topic
                ).count()

                practiced_ids = set()

                # ----------------------------------------------------
                # FULL LENGTH TEST QUESTIONS (from QuestionAnswer)
                # ----------------------------------------------------
                if test_type in ["fullLength", "all"]:
                    full_qs = QuestionAnswer.objects.filter(
                        result__test_submission__student=student,
                        course_subject=cs,
                        question__topic=topic      # ✅ FIXED FIELD
                    ).values_list("question_id", flat=True)

                    practiced_ids |= set(full_qs)

                # ----------------------------------------------------
                # PRACTICE TEST QUESTIONS (from PracticeTestResult)
                # ----------------------------------------------------
                if test_type in ["practiceTest", "all"]:

                    practice_tests = PracticeTest.objects.filter(
                        student=student,
                        course_subject=cs
                    )

                    practice_qs = PracticeQuestionAnswer.objects.filter(
                        practice_test_result__practice_test__in=practice_tests,
                        question__topic=topic      # ✅ FIXED FIELD
                    ).values_list("question_id", flat=True)

                    practiced_ids |= set(practice_qs)

                practiced_count = len(practiced_ids)

                percent = round(
                    (practiced_count / total_questions) * 100, 2
                ) if total_questions else 0

                subject_block["topics"].append({
                    "topic": topic.name,
                    "total_questions": total_questions,
                    "practiced_questions": practiced_count,
                    "practice_percent": percent,
                })

            final_response.append(subject_block)

        return Response(final_response)

    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAuthenticated],
    url_path='Topic_Wise_Accuracy'
)
    def Topic_Wise_Accuracy(self, request, *args, **kwargs):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type", "all")  # fullLength, practiceTest, all

        if not student_id or not course_id:
            return Response({"error": "student_id and course_id are required"}, status=400)

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)
        course_subjects = CourseSubjects.objects.filter(course=course)

        final_response = []

        for cs in course_subjects:

            subject_block = {
                "subject": cs.subject.name,
                "topics": []
            }

            # All topics under subject
            topics = Topic.objects.filter(course_subject=cs)

            for topic in topics:

                # Count attempted & correct
                attempted_ids = set()
                correct_ids = set()

                # ---------------------------
                # FULL LENGTH TEST ANSWERS
                # ---------------------------
                if test_type in ["fullLength", "all"]:
                    full_qs = QuestionAnswer.objects.filter(
                        result__test_submission__student=student,
                        course_subject=cs,
                        question__topic=topic,
                        is_skipped=False
                    )

                    attempted_ids |= set(full_qs.values_list("question_id", flat=True))
                    correct_ids |= set(
                        full_qs.filter(is_correct=True).values_list("question_id", flat=True)
                    )

                # ---------------------------
                # PRACTICE TEST ANSWERS
                # ---------------------------
                if test_type in ["practiceTest", "all"]:
                    practice_tests = PracticeTest.objects.filter(
                        student=student, 
                        course_subject=cs
                    )

                    practice_qs = PracticeQuestionAnswer.objects.filter(
                        practice_test_result__practice_test__in=practice_tests,
                        question__topic=topic,
                        is_skipped=False
                    )

                    attempted_ids |= set(practice_qs.values_list("question_id", flat=True))
                    correct_ids |= set(
                        practice_qs.filter(is_correct=True).values_list("question_id", flat=True)
                    )

                total_attempted = len(attempted_ids)
                total_correct = len(correct_ids)

                accuracy_percent = (
                    round((total_correct / total_attempted) * 100, 2)
                    if total_attempted else 0
                )

                subject_block["topics"].append({
                    "topic": topic.name,
                    "total_attempted": total_attempted,
                    "correct": total_correct,
                    "accuracy_percent": accuracy_percent,
                })

            final_response.append(subject_block)

        return Response(final_response)
    
    @action(
    detail=False,
    methods=['GET'],
    permission_classes=[IsAuthenticated],
    url_path='SubTopic_Wise_Practice'
)
    def SubTopic_Wise_Practice(self, request, *args, **kwargs):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type", "all")  # fullLength, practiceTest, all

        if not student_id or not course_id:
            return Response({"error": "student_id and course_id are required"}, status=400)

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)
        course_subjects = CourseSubjects.objects.filter(course=course)

        final_response = []

        for cs in course_subjects:

            subject_block = {
                "subject": cs.subject.name,
                "topics": []
            }

            topics = Topic.objects.filter(course_subject=cs)

            for topic in topics:

                topic_block = {
                    "topic": topic.name,
                    "subtopics": []
                }

                subtopics = SubTopic.objects.filter(topic=topic)

                for sub in subtopics:

                    # ⭐ Total questions in DB
                    total_questions = Question.objects.filter(
                        course_subject=cs,
                        topic=topic,
                        sub_topic=sub
                    ).count()

                    practiced_ids = set()
                    right_ids = set()
                    time_spent = 0
                    attempted_count = 0

                    # ==================================================
                    # ⭐ FULL LENGTH TEST DATA
                    # ==================================================
                    if test_type in ["fullLength", "all"]:
                        full_entries = QuestionAnswer.objects.filter(
                            result__test_submission__student=student,
                            course_subject=cs,
                            question__topic=topic,
                            question__sub_topic=sub
                        )

                        practiced_ids |= set(full_entries.values_list("question_id", flat=True))
                        right_ids |= set(full_entries.filter(is_correct=True).values_list("question_id", flat=True))

                        time_spent += sum(full_entries.values_list("time_taken", flat=True) or [0])
                        attempted_count += full_entries.count()

                    # ==================================================
                    # ⭐ PRACTICE TEST DATA
                    # ==================================================
                    if test_type in ["practiceTest", "all"]:

                        practice_entries = PracticeQuestionAnswer.objects.filter(
                            practice_test_result__practice_test__student=student,
                            practice_test_result__practice_test__course_subject=cs,
                            question__topic=topic,
                            question__sub_topic=sub
                        )

                        practiced_ids |= set(practice_entries.values_list("question_id", flat=True))
                        right_ids |= set(practice_entries.filter(is_correct=True).values_list("question_id", flat=True))

                        time_spent += sum(practice_entries.values_list("time_taken", flat=True) or [0])
                        attempted_count += practice_entries.count()

                    # ==================================================
                    # ⭐ CALCULATIONS
                    # ==================================================
                    practiced_count = len(practiced_ids)
                    practice_percent = round((practiced_count / total_questions) * 100, 2) if total_questions else 0

                    accuracy_percent = round(
                        (len(right_ids) / attempted_count) * 100, 2
                    ) if attempted_count else 0

                    avg_time = round(time_spent / attempted_count, 2) if attempted_count else 0

                    # ==================================================
                    # ⭐ BUILD SUBTOPIC BLOCK
                    # ==================================================
                    topic_block["subtopics"].append({
                        "subtopic": sub.name,
                        "total_questions": total_questions,
                        "practiced_questions": practiced_count,
                        "practice_percent": practice_percent,
                        "accuracy_percent": accuracy_percent,
                        "avg_time_seconds": avg_time,
                        "total_time_spent": time_spent,
                    })

                subject_block["topics"].append(topic_block)

            final_response.append(subject_block)

        return Response(final_response)
    
    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="scoreboard_flt"
)
    def scoreboard_flt(self, request):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")

        if not student_id or not course_id:
            return Response(
                {"error": "student_id and course_id are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        labels = ["Recent", "Second Last", "Third Last", "Fourth Last", "Fifth Last"]
        response = []

        # =====================================================
        # ✅ FULL LENGTH TEST SCOREBOARD (COMBINEDSCORE 200–800)
        # =====================================================
        submissions = (
            TestSubmission.objects.filter(
                student=student,
                test__course=course,
                status=TestSubmission.COMPLETED
            )
            .select_related("test")
            .order_by("-completion_date")[:5]
        )

        for idx, submission in enumerate(submissions):
            test = submission.test
            result = submission.result

            english_score = 0
            math_score = 0
            english_accuracy = 0
            math_accuracy = 0
            total_score = 0

            sections = Section.objects.filter(test=test)

            # Map: subject_name -> [sections]
            subject_map = {}
            for section in sections:
                subject_name = section.course_subject.subject.name
                subject_map.setdefault(subject_name, []).append(section)

            # ---------- SUBJECT LOOP ----------
            for subject_name, subject_sections in subject_map.items():

                section_1_correct = 0
                section_2_correct = 0
                total_correct = 0
                total_wrong = 0

                for section in subject_sections:
                    for sub_section in section.sub_sections:

                        qas = QuestionAnswer.objects.filter(
                            result=result,
                            course_subject=section.course_subject,
                            section_id=sub_section["id"]
                        )

                        correct = qas.filter(is_correct=True).count()
                        wrong = qas.filter(is_correct=False, is_skipped=False).count()

                        total_correct += correct
                        total_wrong += wrong

                        # ✅ SAME SPLIT AS get_details
                        if sub_section["id"] == 1:
                            section_1_correct += correct
                        else:
                            section_2_correct += correct

                attempted = total_correct + total_wrong
                accuracy = round(
                    (total_correct / attempted) * 100, 2
                ) if attempted else 0

                # ✅ CombinedScore lookup (200–800)
                score_record = CombinedScore.objects.filter(
                    subject_name=subject_name,
                    section1_correct=section_1_correct,
                    section2_correct=section_2_correct
                ).first()

                scaled_score = score_record.total_score if score_record else 0

                if subject_name.lower() == "english":
                    english_score = scaled_score
                    english_accuracy = accuracy
                elif subject_name.lower() == "math":
                    math_score = scaled_score
                    math_accuracy = accuracy

                total_score += scaled_score

            response.append({
                "label": labels[idx],
                "test_date": submission.completion_date.date()
                            if submission.completion_date else None,

                "total_score": total_score,

                "english_score": english_score,
                "english_accuracy": english_accuracy,

                "math_score": math_score,
                "math_accuracy": math_accuracy,
            })

        return Response({
            "test_type": "fullLength",
            "results": response
        })


    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="practice-scoreboard"
)
    def practice_scoreboard(self, request):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")

        if not student_id or not course_id:
            return Response(
                {"error": "student_id and course_id are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        response = []

        course_subjects = CourseSubjects.objects.filter(course=course)

        for cs in course_subjects:

            practice_results = PracticeTestResult.objects.filter(
                practice_test__student=student,
                practice_test__course_subject=cs
            )

            if not practice_results.exists():
                continue

            answers = PracticeQuestionAnswer.objects.filter(
                practice_test_result__in=practice_results
            )

            total_questions = answers.count()

            if total_questions == 0:
                continue

            total_correct = answers.filter(is_correct=True).count()
            total_wrong = answers.filter(is_correct=False, is_skipped=False).count()
            total_skip = answers.filter(is_skipped=True).count()

            # ✅ Exact total time (per question)
            total_time = answers.aggregate(
                total=Sum("time_taken")
            )["total"] or 0

            # ✅ Exact average
            avg_time = round(total_time / total_questions, 2)

            last_practice_date = practice_results.aggregate(
                Max("created_at")
            )["created_at__max"]

            response.append({
                "subject_name": cs.subject.name,
                "test_date": last_practice_date.date() if last_practice_date else None,
                "total_correct": total_correct,
                "total_wrong": total_wrong,
                "total_skip": total_skip,
                "total_time_seconds": total_time,        # ✅ 60
                "avg_time_per_question": avg_time        # ✅ 20
            })

        return Response({
            "test_type": "practice",
            "results": response
        })


    
    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="utilisation-full-length"
)
    def utilisation_full_length(self, request):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")

        if not student_id or not course_id:
            return Response(
                {"error": "student_id and course_id are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        # ------------------------------------------------
        # 1️⃣ FULL LENGTH DB TOTAL (ONLY ACTIVE QUESTIONS)
        # ------------------------------------------------
        full_length_totals = (
            Question.objects
            .filter(
                course_subject__course=course,
                test_type=Question.FULL_LENGTH_TEST_TYPE,
                is_active=True                 # ✅ ONLY ACTIVE
            )
            .values("course_subject__subject__name")
            .annotate(total=Count("id"))
        )

        total_questions_map = {
            row["course_subject__subject__name"]: row["total"]
            for row in full_length_totals
        }

        # ------------------------------------------------
        # 2️⃣ STUDENT ANSWERED (ONLY ACTIVE QUESTIONS)
        # ------------------------------------------------
        attempted_qs = (
            QuestionAnswer.objects
            .filter(
                result__test_submission__student=student,
                result__test_submission__test__course=course,
                result__test_submission__test__test_type=Test.EXAM,
                is_skipped=False,
                question__is_active=True       # ✅ ONLY ACTIVE
            )
            .values(
                "course_subject__subject__name",
                "question"
            )
            .distinct()
        )

        attempted_map = {}
        for row in attempted_qs:
            subject = row["course_subject__subject__name"]
            attempted_map[subject] = attempted_map.get(subject, 0) + 1

        # ------------------------------------------------
        # 3️⃣ BUILD RESPONSE
        # ------------------------------------------------
        response = {}

        for cs in CourseSubjects.objects.filter(course=course):
            subject = cs.subject.name

            total = total_questions_map.get(subject, 0)
            answered = attempted_map.get(subject, 0)
            pending = max(0, total - answered)

            response[subject] = {
                "total": total,        # ✅ active full-length only
                "answered": answered,
                "unanswered": pending,
                "pending": pending,
                "done": answered
            }

        return Response({
            "test_type": "fullLength",
            "subjects": response
        })



    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="utilisation-practice"
)
    def utilisation_practice(self, request):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")

        if not student_id or not course_id:
            return Response(
                {"error": "student_id and course_id are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        # ------------------------------------------------
        # 1️⃣ PRACTICE DB TOTAL (ACTIVE QUESTIONS ONLY)
        # ------------------------------------------------
        practice_totals = (
            Question.objects
            .filter(
                course_subject__course=course,
                test_type=Question.SELF_PRACTICE_TEST_TYPE,
                is_active=True                       # ✅ ONLY ACTIVE
            )
            .values("course_subject__subject__name")
            .annotate(total=Count("id"))
        )

        total_questions_map = {
            row["course_subject__subject__name"]: row["total"]
            for row in practice_totals
        }

        # ------------------------------------------------
        # 2️⃣ STUDENT ANSWERED PRACTICE (ACTIVE ONLY)
        # ------------------------------------------------
        attempted_qs = (
            PracticeQuestionAnswer.objects
            .filter(
                practice_test_result__practice_test__student=student,
                practice_test_result__practice_test__course_subject__course=course,
                is_skipped=False,
                question__is_active=True            # ✅ ONLY ACTIVE
            )
            .values(
                "practice_test_result__practice_test__course_subject__subject__name",
                "question"
            )
            .distinct()
        )

        attempted_map = {}
        for row in attempted_qs:
            subject = row["practice_test_result__practice_test__course_subject__subject__name"]
            attempted_map[subject] = attempted_map.get(subject, 0) + 1

        # ------------------------------------------------
        # 3️⃣ BUILD RESPONSE
        # ------------------------------------------------
        response = {}

        for cs in CourseSubjects.objects.filter(course=course):
            subject = cs.subject.name

            total = total_questions_map.get(subject, 0)
            answered = attempted_map.get(subject, 0)
            pending = max(0, total - answered)

            response[subject] = {
                "total": total,        # ✅ ACTIVE PRACTICE DB TOTAL
                "answered": answered,
                "unanswered": pending,
                "pending": pending,
                "done": answered
            }

        return Response({
            "test_type": "self_practice",
            "subjects": response
        })



    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="pattern-of-usage"
)
    def pattern_of_usage(self, request):

        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type")  # FULL_LENGTH | PRACTICE

        if not student_id or not course_id or not test_type:
            return Response(
                {"error": "student_id, course_id and test_type are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        results = []

        # =====================================================
        # ✅ FULL LENGTH TEST (LATEST 7)
        # =====================================================
        if test_type == "FULL_LENGTH":

            submissions = (
                TestSubmission.objects
                .filter(
                    student=student,
                    test__course=course,
                    status=TestSubmission.COMPLETED
                )
                .select_related("test", "result")
                .order_by("-completion_date")[:7]   # 🔥 ONLY 7 (LATEST)
            )

            for submission in submissions:
                if not hasattr(submission, "result"):
                    continue

                result = submission.result

                # ✅ SAME TIME LOGIC AS details API
                total_time_seconds = (
                    SectionStats.objects
                    .filter(result=result)
                    .aggregate(total=Sum("time_taken"))["total"] or 0
                )

                total_questions = QuestionAnswer.objects.filter(result=result).count()

                results.append({
                    "test_submission_id": submission.id,
                    "test_id": submission.test.id,
                    "test_type": "FULL_LENGTH",
                    "date": submission.completion_date.strftime("%Y-%m-%d"),
                    "time": round(total_time_seconds / 60, 2),
                    "questions": total_questions,
                    "details": f"Full Length Test - {submission.test.name}"
                })

        # =====================================================
        # ✅ PRACTICE TEST (LATEST 7)
        # =====================================================
        elif test_type == "PRACTICE":

            practice_results = (
                PracticeTestResult.objects
                .filter(
                    practice_test__student=student,
                    practice_test__course_subject__course=course
                )
                .select_related("practice_test")
                .order_by("-created_at")[:7]   # 🔥 ONLY 7
            )

            for r in practice_results:
                results.append({
                    "test_submission_id": r.practice_test.id,
                    "test_id": None,
                    "test_type": "PRACTICE",
                    "date": r.created_at.strftime("%Y-%m-%d"),
                    "time": round((r.time_taken or 0) / 60,2),
                    "questions": r.question_answers.count(),
                    "details": "Practice Test Activity"
                })

        else:
            return Response({"error": "Invalid test_type"}, status=400)

        # 🔁 Oldest → Newest for chart
        results.reverse()

        return Response({
            "count": len(results),
            "results": results
        })


    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="topic-wise-progress"
)
    def topic_wise_progress_average(self, request):

        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        subject_name = request.GET.get("subject")
        test_type = request.GET.get("test_type")

        if not all([student_id, course_id, subject_name, test_type]):
            return Response(
                {"error": "student_id, course_id, subject and test_type are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        course_subject = CourseSubjects.objects.filter(
            course=course,
            subject__name__iexact=subject_name
        ).first()

        if not course_subject:
            return Response({"results": []})

        topic_map = defaultdict(lambda: {
            "correct": 0,
            "total": 0,
            "sub_topics": defaultdict(lambda: {"correct": 0, "total": 0})
        })

        total_questions = 0
        total_correct = 0
        total_attempted = 0

        # ================= FULL LENGTH =================
        if test_type == "FULL_LENGTH":

            submissions = TestSubmission.objects.filter(
                student=student,
                test__course=course,
                status=TestSubmission.COMPLETED
            ).select_related("result")

            if not submissions.exists():
                return Response({"results": []})

            answers = QuestionAnswer.objects.filter(
                result__in=submissions.values("result"),
                course_subject=course_subject
            ).select_related("question", "question__topic", "question__sub_topic")

        # ================= PRACTICE =================
        elif test_type == "PRACTICE":

            practice_results = PracticeTestResult.objects.filter(
                practice_test__student=student,
                practice_test__course_subject=course_subject
            )

            if not practice_results.exists():
                return Response({"results": []})

            answers = PracticeQuestionAnswer.objects.filter(
                practice_test_result__in=practice_results
            ).select_related("question", "question__topic", "question__sub_topic")

        else:
            return Response({"error": "Invalid test_type"}, status=400)

        # ================= AGGREGATION =================
        for ans in answers:

            total_questions += 1

            if not ans.is_skipped:
                total_attempted += 1

            if ans.is_correct:
                total_correct += 1

            if ans.is_skipped:
                continue

            question = ans.question
            topic = question.topic.name if question.topic else "General"
            sub_topic = question.sub_topic.name if question.sub_topic else "General"

            topic_map[topic]["total"] += 1
            if ans.is_correct:
                topic_map[topic]["correct"] += 1

            topic_map[topic]["sub_topics"][sub_topic]["total"] += 1
            if ans.is_correct:
                topic_map[topic]["sub_topics"][sub_topic]["correct"] += 1

        # ================= FORMAT =================
        chart_data = []
        accordion_data = []

        strong_topics = 0
        weak_topics = 0

        for topic, data in topic_map.items():

            score = round((data["correct"] / data["total"]) * 100) if data["total"] else 0

            if score >= 75:
                strong_topics += 1
            else:
                weak_topics += 1

            chart_data.append({
                "shortName": topic.split()[0],
                "fullName": topic,
                "value": score
            })

            accordion_data.append({
                "title": topic,
                "score": score,
                "subTopics": [
                    {
                        "name": sub,
                        "score": round((v["correct"] / v["total"]) * 100) if v["total"] else 0,
                        "status": (
                            "Strong" if (v["correct"] / v["total"]) >= 0.75
                            else "On Track" if (v["correct"] / v["total"]) >= 0.5
                            else "Needs Improvement"
                        )
                    }
                    for sub, v in data["sub_topics"].items()
                ]
            })

        # ================= SKILLS DATA =================
        accuracy = round((total_correct / total_attempted) * 100) if total_attempted else 0
        attempt_rate = round((total_attempted / total_questions) * 100) if total_questions else 0

        skills_data = [
            {"name": "Accuracy", "value": accuracy},
            {"name": "Attempt Rate", "value": attempt_rate},
            {"name": "Strong Topics", "value": strong_topics},
            {"name": "Weak Topics", "value": weak_topics},
        ]

        return Response({
            "mode": "AVERAGE",
            "test_type": test_type,
            "chartData": chart_data,
            "skillsData": skills_data,
            "accordionData": accordion_data,
        })

    
    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="score-analysis"
)
    def score_analysis(self, request):

        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type")  # FULL_LENGTH | PRACTICE

        if not student_id or not course_id or not test_type:
            return Response(
                {"error": "student_id, course_id and test_type are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        response = {
            "overall_score": 0,
            "math_score": 0,
            "english_score": 0,
            "highest_score": 0,
            "improvement": 0,
            "tests": []
        }

        # =====================================================
        # ✅ FULL LENGTH TESTS (SAT / DSAT)
        # =====================================================
        if test_type == "FULL_LENGTH":

            submissions = (
                TestSubmission.objects
                .filter(
                    student=student,
                    test__course=course,
                    status=TestSubmission.COMPLETED
                )
                .select_related("test", "result")
                .order_by("completion_date")
            )

            previous_overall = None
            total_full_length_tests = 0

            for submission in submissions:
                total_full_length_tests += 1

                test = submission.test
                result = submission.result

                math_score = 0
                english_score = 0

                sections = Section.objects.filter(test=test).order_by("order")

                for section in sections:
                    course_subject = section.course_subject
                    subject_name = course_subject.subject.name.lower()

                    section_1_correct = 0
                    section_2_correct = 0

                    for sub_section in section.sub_sections:
                        correct_count = QuestionAnswer.objects.filter(
                            result=result,
                            course_subject=course_subject,
                            section_id=sub_section["id"],
                            is_correct=True
                        ).count()

                        if sub_section["id"] == 1:
                            section_1_correct = correct_count
                        elif sub_section["id"] == 2:
                            section_2_correct = correct_count

                    score_record = CombinedScore.objects.filter(
                        subject_name__iexact=subject_name,
                        section1_correct=section_1_correct,
                        section2_correct=section_2_correct
                    ).first()

                    if score_record:
                        if subject_name == "math":
                            math_score = score_record.total_score
                        else:
                            english_score = score_record.total_score

                overall = math_score + english_score

                response["tests"].append({
                    "test_submission_id": submission.id,
                    "test_name": test.name,
                    "math_score": math_score,
                    "english_score": english_score,
                    "overall_score": overall,

                    # ✅ DATE ADDED
                    "date": (
                        submission.completion_date.strftime("%Y-%m-%d")
                        if submission.completion_date
                        else submission.assigned_date.strftime("%Y-%m-%d")
                    )
                })

                response["highest_score"] = max(response["highest_score"], overall)

                if previous_overall is not None:
                    response["improvement"] = overall - previous_overall

                previous_overall = overall
                response["overall_score"] = overall
                response["math_score"] = math_score
                response["english_score"] = english_score

            response["total_full_length_tests"] = total_full_length_tests

        # =====================================================
        # ✅ PRACTICE TEST
        # =====================================================
        elif test_type == "PRACTICE":

            total_correct = 0
            total_incorrect = 0
            total_questions = 0

            practice_results = (
                PracticeTestResult.objects
                .filter(
                    practice_test__student=student,
                    practice_test__course_subject__course=course
                )
                .select_related(
                    "practice_test",
                    "practice_test__course_subject__subject"
                )
                .order_by("created_at")
            )

            previous_score = None

            for r in practice_results:
                subject_name = r.practice_test.course_subject.subject.name.lower()

                test_total_questions = PracticeQuestionAnswer.objects.filter(
                    practice_test_result=r
                ).count()

                test_correct = PracticeQuestionAnswer.objects.filter(
                    practice_test_result=r,
                    is_correct=True
                ).count()

                test_incorrect = PracticeQuestionAnswer.objects.filter(
                    practice_test_result=r,
                    is_correct=False,
                    is_skipped=False
                ).count()

                accuracy = round(
                    (test_correct / test_total_questions) * 100
                ) if test_total_questions > 0 else 0

                if subject_name == "math":
                    response["math_score"] += test_correct
                elif subject_name == "english":
                    response["english_score"] += test_correct

                response["highest_score"] = max(response["highest_score"], test_correct)

                if previous_score is not None:
                    response["improvement"] = test_correct - previous_score

                previous_score = test_correct

                total_correct += test_correct
                total_incorrect += test_incorrect
                total_questions += test_total_questions

                response["tests"].append({
                    "practice_test_id": r.practice_test.id,
                    "subject": subject_name.title(),
                    "total_questions": test_total_questions,
                    "correct": test_correct,
                    "incorrect": test_incorrect,
                    "accuracy": accuracy,
                    "date": r.created_at.strftime("%Y-%m-%d"),
                })

            response["overall_score"] = total_correct
            response["total_practice_tests"] = len(response["tests"])
            response["total_correct"] = total_correct
            response["total_incorrect"] = total_incorrect

            response["overall_accuracy"] = round(
                (total_correct / total_questions) * 100
            ) if total_questions > 0 else 0

        else:
            return Response({"error": "Invalid test_type"}, status=400)

        return Response(response)

    @action(
    detail=False,
    methods=["GET"],
    url_path="attempted-questions",
    permission_classes=[IsAuthenticated],
    pagination_class=AttemptedQuestionsPagination,
)
    def attempted_questions(self, request):
        user = request.user

        # =========================
        # QUERY PARAMS
        # =========================
        test_type = request.query_params.get("test_type")
        course_id = request.query_params.get("course_id")
        subject_id = request.query_params.get("subject_id")
        difficulty = request.query_params.get("difficulty")
        status = request.query_params.get("status")
        search = request.query_params.get("search")
        topic_id = request.query_params.get("topic")  # 🔥 FIXED

        rows = []

        # =====================================================
        # FULL LENGTH TEST
        # =====================================================
        if test_type in [None, "FULL_LENGTH_TEST"]:
            answers = QuestionAnswer.objects.filter(
                result__test_submission__student=user
            ).select_related(
                "question",
                "question__topic",
                "question__sub_topic",
                "course_subject__course",
                "course_subject__subject",
                "result__test_submission__test",
            )

            # ---- course / subject
            if course_id:
                answers = answers.filter(course_subject__course_id=course_id)

            if subject_id:
                answers = answers.filter(course_subject__subject_id=subject_id)

            # ---- difficulty
            if difficulty:
                answers = answers.filter(question__difficulty=difficulty)

            # ---- topic 🔥
            if topic_id:
                answers = answers.filter(question__topic_id=topic_id)

            # ---- search
            if search:
                answers = answers.filter(
                    Q(result__test_submission__test__name__icontains=search) |
                    Q(question__description__icontains=search)
                )

            # ---- status
            if status == "MARKED":
                answers = answers.filter(is_marked_for_review=True)
            elif status == "CORRECT":
                answers = answers.filter(is_correct=True)
            elif status == "INCORRECT":
                answers = answers.filter(is_correct=False, is_skipped=False)
            elif status == "SKIPPED":
                answers = answers.filter(is_skipped=True)

            # ---- build rows
            for qa in answers:
                q = qa.question
                test = qa.result.test_submission.test

                rows.append({
                    "id": qa.id,
                    "test_type": "FULL_LENGTH_TEST",
                    "test_name": test.name,

                    "course": {
                        "id": qa.course_subject.course.id,
                        "name": qa.course_subject.course.name,
                    },
                    "subject": {
                        "id": qa.course_subject.subject.id,
                        "name": qa.course_subject.subject.name,
                    },

                    "description": q.description,
                    "question_type": q.question_type,

                    "status": (
                        "SKIPPED" if qa.is_skipped else
                        "CORRECT" if qa.is_correct else
                        "INCORRECT"
                    ),
                    "is_marked": qa.is_marked_for_review,

                    "difficulty": q.difficulty,
                    "topic": q.topic.name if q.topic else "",
                    "sub_topic": q.sub_topic.name if q.sub_topic else "",

                    "options": q.options,
                    "user_selected_option": qa.selected_options[0] if qa.selected_options else None,

                    "is_correct": qa.is_correct,
                    "is_skipped": qa.is_skipped,

                    "show_calculator": q.show_calculator,
                    "attempted_date": qa.result.test_submission.completion_date,
                    "time_spent": qa.time_taken,
                })

        # =====================================================
        # PRACTICE TEST
        # =====================================================
        if test_type in [None, "SELF_PRACTICE_TEST"]:
            answers = PracticeQuestionAnswer.objects.filter(
                practice_test_result__practice_test__student=user
            ).select_related(
                "question",
                "question__topic",
                "question__sub_topic",
                "practice_test_result__practice_test__course_subject__course",
                "practice_test_result__practice_test__course_subject__subject",
            )

            if course_id:
                answers = answers.filter(
                    practice_test_result__practice_test__course_subject__course_id=course_id
                )

            if subject_id:
                answers = answers.filter(
                    practice_test_result__practice_test__course_subject__subject_id=subject_id
                )

            if difficulty:
                answers = answers.filter(question__difficulty=difficulty)

            # ---- topic 🔥
            if topic_id:
                answers = answers.filter(question__topic_id=topic_id)

            if search:
                answers = answers.filter(
                    Q(practice_test_result__practice_test__id__icontains=search) |
                    Q(question__description__icontains=search)
                )

            if status == "MARKED":
                answers = answers.filter(is_marked_for_review=True)
            elif status == "CORRECT":
                answers = answers.filter(is_correct=True)
            elif status == "INCORRECT":
                answers = answers.filter(is_correct=False, is_skipped=False)
            elif status == "SKIPPED":
                answers = answers.filter(is_skipped=True)

            for qa in answers:
                q = qa.question
                pt = qa.practice_test_result.practice_test

                rows.append({
                    "id": qa.id,
                    "test_type": "SELF_PRACTICE_TEST",
                    "test_name": f"Practice Test {pt.id}",

                    "course": {
                        "id": pt.course_subject.course.id,
                        "name": pt.course_subject.course.name,
                    },
                    "subject": {
                        "id": pt.course_subject.subject.id,
                        "name": pt.course_subject.subject.name,
                    },

                    "description": q.description,
                    "question_type": q.question_type,

                    "status": (
                        "SKIPPED" if qa.is_skipped else
                        "CORRECT" if qa.is_correct else
                        "INCORRECT"
                    ),
                    "is_marked": qa.is_marked_for_review,

                    "difficulty": q.difficulty,
                    "topic": q.topic.name if q.topic else "",
                    "sub_topic": q.sub_topic.name if q.sub_topic else "",

                    "options": q.options,
                    "user_selected_option": qa.selected_options[0] if qa.selected_options else None,

                    "is_correct": qa.is_correct,
                    "is_skipped": qa.is_skipped,

                    "show_calculator": q.show_calculator,
                    "attempted_date": qa.practice_test_result.created_at,
                    "time_spent": qa.time_taken,
                })

        # =====================================================
        # PAGINATION + RESPONSE
        # =====================================================
        page = self.paginate_queryset(rows)
        serializer = AttemptedQuestionSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)





class PracticeTestViewSet(viewsets.ModelViewSet):
    queryset = PracticeTest.objects.all()
    logger = logging.getLogger('Practice-Test')
    filter_backends = []

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

    @action(
    detail=False,
    methods=['POST'],
    permission_classes=[IsStudent],
    url_path='start-practice'
)
    def start_practice_test(self, request):
        from test_manager.models import (
            PracticeTest,
            PracticeTestResult,
            PracticeQuestionAnswer,
            CourseSubjects,
            Question
        )

        student = request.user
        course_subject_id = request.data.get('course_subject_id')

        if not course_subject_id:
            return get_error_response("course_subject_id is required")

        # =====================================================
        # BASE FILTERS
        # =====================================================
        query_filters = Q(
            course_subject_id=course_subject_id,
            test_type=Question.SELF_PRACTICE_TEST_TYPE,
            is_active=True
        )

        # ---------------- Topic Filter ----------------
        topic = request.data.get('topic', '')
        if topic:
            query_filters &= Q(topic_id__in=topic.split(','))

        # ---------------- Sub Topic Filter ----------------
        sub_topic = request.data.get('sub_topic', '')
        if sub_topic:
            query_filters &= Q(sub_topic_id__in=sub_topic.split(','))

        # ---------------- Difficulty Filter ----------------
        difficulty = request.data.get('difficulty', '')
        if difficulty:
            query_filters &= Q(difficulty__in=difficulty.split(','))

        # =====================================================
        # QUESTION MODE FILTER
        # =====================================================
        question_mode = request.data.get('question_mode', 'BOTH')

        questions = Question.objects.filter(query_filters)

        # Previously answered questions by student
        previously_answered_ids = PracticeQuestionAnswer.objects.filter(
            practice_test_result__practice_test__student=student
        ).values_list('question_id', flat=True)

        if question_mode == 'UNANSWERED':
            questions = questions.exclude(id__in=previously_answered_ids)

        elif question_mode == 'INCORRECT':
            incorrect_ids = PracticeQuestionAnswer.objects.filter(
                practice_test_result__practice_test__student=student,
                is_correct=False,
                is_skipped=False
            ).values_list('question_id', flat=True)

            questions = questions.filter(id__in=incorrect_ids)

        elif question_mode == 'BOTH':
            incorrect_ids = PracticeQuestionAnswer.objects.filter(
                practice_test_result__practice_test__student=student,
                is_correct=False,
                is_skipped=False
            ).values_list('question_id', flat=True)

            unanswered_ids = questions.exclude(
                id__in=previously_answered_ids
            ).values_list('id', flat=True)

            questions = questions.filter(
                Q(id__in=incorrect_ids) | Q(id__in=unanswered_ids)
            )

        # =====================================================
        # SHUFFLE & LIMIT QUESTIONS
        # =====================================================
        question_ids = list(questions.values_list('id', flat=True))
        random.shuffle(question_ids)

        no_of_questions = int(request.data.get('no_of_questions', 0))
        if no_of_questions > 0:
            question_ids = question_ids[:no_of_questions]

        # =====================================================
        # ❌ DO NOT CREATE TEST IF NO QUESTIONS
        # =====================================================
        if not question_ids:
            return Response(
                {
                    "detail": "No questions available for the selected filters.",
                    "practice_test_id": None,
                    "question_ids": []
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # CREATE PRACTICE TEST
        # =====================================================
        course_subject = get_object_or_404(CourseSubjects, id=course_subject_id)

        practice_test = PracticeTest.objects.create(
            student=student,
            course_subject=course_subject
        )

        practice_test_result = PracticeTestResult.objects.create(
            practice_test=practice_test,
            correct_answer_count=0,
            incorrect_answer_count=0,
            time_taken=0,
            detailed_view={}
        )

        # =====================================================
        # CREATE PLACEHOLDER QUESTION ANSWERS
        # =====================================================
        bulk_answers = [
            PracticeQuestionAnswer(
                practice_test_result=practice_test_result,
                question_id=qid,
                order=index,
                is_correct=False,
                is_skipped=True,
                time_taken=0,
                selected_options=[],
                striked_options=[],
                times_visited=0,
                first_time_taken=0,
                is_marked_for_review=False
            )
            for index, qid in enumerate(question_ids)
        ]

        PracticeQuestionAnswer.objects.bulk_create(bulk_answers)

        # =====================================================
        # RESPONSE
        # =====================================================
        return Response(
            {
                "practice_test_id": practice_test.id,
                "question_ids": question_ids
            },
            status=status.HTTP_201_CREATED
        )

    @action(
    detail=False,
    methods=['POST'],
    permission_classes=[IsStudent],
    url_path='practice-question-count'
)
    def practice_question_count(self, request):
        from test_manager.models import (
            PracticeQuestionAnswer,
            Question
        )

        student = request.user
        course_subject_id = request.data.get('course_subject_id')

        if not course_subject_id:
            return Response(
                {"detail": "course_subject_id is required"},
                status=400
            )

        # =====================================================
        # BASE FILTERS (SAME AS start_practice)
        # =====================================================
        query_filters = Q(
            course_subject_id=course_subject_id,
            test_type=Question.SELF_PRACTICE_TEST_TYPE,
            is_active=True
        )

        topic = request.data.get('topic', '')
        if topic:
            query_filters &= Q(topic_id__in=topic.split(','))

        sub_topic = request.data.get('sub_topic', '')
        if sub_topic:
            query_filters &= Q(sub_topic_id__in=sub_topic.split(','))

        difficulty = request.data.get('difficulty', '')
        if difficulty:
            query_filters &= Q(difficulty__in=difficulty.split(','))

        questions = Question.objects.filter(query_filters)

        # =====================================================
        # QUESTION MODE LOGIC
        # =====================================================
        question_mode = request.data.get('question_mode', 'BOTH')

        previously_answered_ids = PracticeQuestionAnswer.objects.filter(
            practice_test_result__practice_test__student=student
        ).values_list('question_id', flat=True)

        if question_mode == 'UNANSWERED':
            questions = questions.exclude(id__in=previously_answered_ids)

        elif question_mode == 'INCORRECT':
            incorrect_ids = PracticeQuestionAnswer.objects.filter(
                practice_test_result__practice_test__student=student,
                is_correct=False,
                is_skipped=False
            ).values_list('question_id', flat=True)

            questions = questions.filter(id__in=incorrect_ids)

        elif question_mode == 'BOTH':
            incorrect_ids = PracticeQuestionAnswer.objects.filter(
                practice_test_result__practice_test__student=student,
                is_correct=False,
                is_skipped=False
            ).values_list('question_id', flat=True)

            unanswered_ids = questions.exclude(
                id__in=previously_answered_ids
            ).values_list('id', flat=True)

            questions = questions.filter(
                Q(id__in=incorrect_ids) | Q(id__in=unanswered_ids)
            )

        return Response(
            {
                "total_available": questions.count()
            },
            status=200
        )


    @permission_classes([IsAdminOrMentorOrFacultyOrStudentOrParent])
    def list(self, request):
        user = request.user
        student_ids = []

        # ---------------------------------
        # 1️⃣ BASE QUERYSET (ROLE BASED)
        # ---------------------------------

        if user.role.name == 'student':
            queryset = PracticeTest.objects.filter(
                student=user,
                result__isnull=False
            )

        elif user.role.name in ['parent', 'faculty', 'mentor', 'admin']:

            if user.role.name == 'parent':
                sm = StudentMetadata.objects.filter(
                    Q(father=user) | Q(mother=user)
                )
                student_ids = sm.values_list('student', flat=True)

            elif user.role.name == 'faculty':
                sm = StudentMetadata.objects.filter(faculties=user)
                student_ids = sm.values_list('student', flat=True)

            elif user.role.name == 'mentor':
                sm = StudentMetadata.objects.filter(mentor=user)
                student_ids = sm.values_list('student', flat=True)

            elif user.role.name == 'admin':
                student_id = request.GET.get('student_id')
                student_ids = (
                    [student_id]
                    if student_id
                    else StudentMetadata.objects.values_list('student', flat=True)
                )

            queryset = PracticeTest.objects.filter(
                student__in=student_ids,
                result__isnull=False
            )

        else:
            return get_error_response('Access denied')

        # ---------------------------------
        # 2️⃣ CORRECT ANNOTATIONS (NO NEGATIVES)
        # ---------------------------------

        queryset = queryset.annotate(

        # TOTAL QUESTIONS
        total_questions=Count(
            'result__question_answers',
            distinct=True
        ),

        # CORRECT
        correct_count=Count(
            'result__question_answers',
            filter=Q(
                result__question_answers__is_correct=True
            ),
            distinct=True
        ),

        # SKIPPED
        skipped_count=Count(
            'result__question_answers',
            filter=Q(
                result__question_answers__is_skipped=True
            ),
            distinct=True
        ),

        # INCORRECT = answered + wrong + not skipped
        incorrect_count=Count(
            'result__question_answers',
            filter=Q(
                result__question_answers__is_correct=False,
                result__question_answers__is_skipped=False,
                result__question_answers__is_correct__isnull=False,  # 🔥 KEY FIX
            ),
            distinct=True
        ),

        # PERFORMANCE
        performance=ExpressionWrapper(
            Count(
                'result__question_answers',
                filter=Q(result__question_answers__is_correct=True),
                distinct=True
            ) * 1.0 /
            NullIf(
                Count('result__question_answers', distinct=True),
                0
            ),
            output_field=FloatField()
        )
    
    


        ).select_related(
            'student',
            'course_subject__course',
            'course_subject__subject',
            'result'
        )

        # ---------------------------------
        # 3️⃣ APPLY FILTERS (WITHOUT ORDERING)
        # ---------------------------------

        query_params = request.GET.copy()
        ordering = query_params.pop('ordering', None)
        query_params.pop('page', None)
        query_params.pop('page_size', None)

        filterset = PracticeTestFilter(query_params, queryset=queryset)
        queryset = filterset.qs

        # ---------------------------------
        # 4️⃣ MANUAL ORDERING
        # ---------------------------------

        if ordering:
            ordering = ordering[0]

            if ordering == 'performance':
                queryset = queryset.order_by('performance')

            elif ordering == '-performance':
                queryset = queryset.order_by('-performance')

            else:
                queryset = queryset.order_by(ordering)

        else:
            # Latest practice test first
            queryset = queryset.order_by('-id')

        # ---------------------------------
        # 5️⃣ PAGINATION
        # ---------------------------------

        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = PracticeTestListSerializer(
            page,
            many=True,
            context={'request': request}
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





