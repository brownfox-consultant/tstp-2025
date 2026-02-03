from rest_framework import serializers

from course_manager.models import CourseEnrollment
from user_manager.models import User
from .models import Test, Section, TestSubmission, PracticeTestResult, PracticeTest, TestFeedback
from course_manager.models import (
    Course,
    CourseSubjects,
    CombinedScore
)
from test_manager.models import (
    TestSubmission,
    Result,
    Section,
    SectionStats,
    QuestionAnswer,
    PracticeTestResult
)
from django.db.models import Count

from rest_framework import serializers
from test_manager.models import QuestionAnswer


class SectionSerializer(serializers.ModelSerializer):
    sections = serializers.JSONField(source='sub_sections')

    class Meta:
        model = Section
        fields = ['id', 'course_subject', 'name', 'order', 'sections']


class TestSerializer(serializers.ModelSerializer):
    subject = SectionSerializer(many=True, read_only=True, source='section_set')
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'course', 'course_name', 'name', 'test_type', 'format_type', 'created_at', 'updated_at',
                  'created_by', 'updated_by', 'subject', 'show_skip_button', 'show_prev_button']


class TestListSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'course', 'course_name', 'name', 'test_type', 'format_type', 'show_skip_button',
                  'show_prev_button', 'created_at', 'updated_at']


class TestSubmissionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='test.id', read_only=True)
    test_submission_id = serializers.IntegerField(source='id', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    course = serializers.CharField(source='test.course.id', read_only=True)
    course_name = serializers.CharField(source='test.course.name', read_only=True)
    name = serializers.CharField(source='test.name', read_only=True)
    test_type = serializers.CharField(source='test.test_type', read_only=True)
    format_type = serializers.CharField(source='test.format_type', read_only=True)
    show_skip_button = serializers.CharField(source='test.show_skip_button', read_only=True)
    show_prev_button = serializers.CharField(source='test.show_prev_button', read_only=True)

    assigned_date = serializers.DateTimeField(format="%b %d, %Y %I:%M %p")
    expiration_date = serializers.DateTimeField(format="%b %d, %Y %I:%M %p")
    completion_date = serializers.DateTimeField(format="%b %d, %Y %I:%M %p", required=False, allow_null=True)


    can_take_test = serializers.SerializerMethodField()

    class Meta:
        model = TestSubmission
        fields = ['id', 'test_submission_id', 'student_name', 'course', 'course_name', 'name', 'test_type',
                  'format_type', 'show_skip_button', 'show_prev_button', 'status', 'expiration_date', 'assigned_date',
                  'completion_date', 'can_take_test']

    def get_can_take_test(self, obj):
        # Logic to determine if the test can be taken
        user = self.context.get('user', None)
        if user and user.role.name == 'student':
            return self.is_eligible_for_student(obj, user)
        return False

    def is_eligible_for_student(self, test_submission, user):
        first_eligible_test = TestSubmission.objects.filter(
            student=user, status__in=[TestSubmission.YET_TO_START, TestSubmission.IN_PROGRESS]
        ).order_by('assigned_date').first()

        return test_submission == first_eligible_test

    def get_assigned_date(self, obj):
        return obj.assigned_date.strftime('%b %d, %Y') if obj.assigned_date else None

    def get_expiration_date(self, obj):
        return obj.expiration_date.strftime('%b %d, %Y') if obj.expiration_date else None

    def get_completion_date(self, obj):
        return obj.completion_date.strftime('%b %d, %Y') if obj.completion_date else None


class ExistingStudentListSerializer(serializers.ModelSerializer):
    test_submission_id = serializers.IntegerField(source='id', read_only=True)
    student_id = serializers.CharField(source='student.id', read_only=True)
    name = serializers.CharField(source='student.name', read_only=True)
    email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = TestSubmission
        fields = ['test_submission_id', 'student_id', 'name', 'email', 'status',
                  'assigned_date', 'expiration_date', 'completion_date']


class PracticeTestResultSerializer(serializers.ModelSerializer):
    correct_count = serializers.IntegerField(source='correct_answer_count')
    incorrect_count = serializers.IntegerField(source='incorrect_answer_count')
    time_taken = serializers.IntegerField()

    class Meta:
        model = PracticeTestResult
        fields = ['correct_count', 'incorrect_count', 'time_taken']


class PracticeTestListSerializer(serializers.ModelSerializer):
    test_name = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    correct_count = serializers.IntegerField(source='result.correct_answer_count', read_only=True)
    incorrect_count = serializers.IntegerField(source='result.incorrect_answer_count', read_only=True)
    time_taken = serializers.IntegerField(source='result.time_taken', read_only=True)
    student = serializers.CharField(source='student.name', read_only=True)
    course = serializers.CharField(source='course_subject.course.name', read_only=True)
    subject = serializers.CharField(source='course_subject.subject.name', read_only=True)
    created_at = serializers.DateTimeField(format="%b %d, %Y %I:%M %p", read_only=True)


    class Meta:
        model = PracticeTest
        fields = ['id','test_name', 'student', 'course', 'subject', 'created_at','total_questions', 'result', 'correct_count', 'incorrect_count', 'time_taken']

    def get_created_at(self, obj):
        return obj.created_at.strftime('%b %d, %Y') if obj.created_at else None
    
    def get_test_name(self, obj):
        """
        Display Test Name as PT-1, PT-2, ...
        """
        return f"PT-{obj.id}"

    def get_total_questions(self, obj):
        """
        Total questions = correct + incorrect + skipped
        """
        if not hasattr(obj, 'result') or not obj.result:
            return 0

        # QuestionAnswer table gives exact count
        return obj.result.question_answers.count()

class EligibleStudentSerializer(serializers.ModelSerializer):
    subscription_type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'subscription_type']

    def get_subscription_type(self, obj):
        """
        If the student has ANY paid subscription in ANY course,
        return 'Paid', else return 'Free'
        """

        # import here to avoid circular import
        from course_manager.models import CourseEnrollment

        # get all enrollments of this student
        enrollments = CourseEnrollment.objects.filter(student=obj)

        if not enrollments.exists():
            return "Free"

        # if ANY enrollment is paid → Paid
        for enrollment in enrollments:
            if enrollment.subscription_type != CourseEnrollment.FREE:
                return "Paid"

        return "Free"


class TestFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestFeedback
        fields = ['id', 'rating', 'description', 'feedback_date', 'test_submission']

        extra_kwargs = {
            'test_submission': {'required': True}  # Ensure the test_submissions is required
        }

    def validate_rating(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Value must be between 1 and 10")
        return value

    def validate_description(self, value):
        if not value:
            raise serializers.ValidationError("Description is required")
        return value


class RecentFullLengthResultSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id")
    student_name = serializers.CharField(source="student.name")
    student_email = serializers.CharField(source="student.email")

    test_name = serializers.CharField(source="test.name")
    course_id = serializers.IntegerField(source="test.course.id")
    course_name = serializers.CharField(source="test.course.name")

    total_score = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source="assigned_date")

    class Meta:
        model = TestSubmission
        fields = [
            "id",
            "student_id",
            "student_name",
            "student_email",
            "test_name",
            "course_id",
            "course_name",
            "total_score",
            "created_at",
        ]

    def get_total_score(self, obj):
        """
        EXACT SAME LOGIC as /api/result/details/
        """
        if not hasattr(obj, "result") or not obj.result:
            return 0

        result = obj.result
        test = obj.test

        total_score = 0

        # Sections grouped by subject
        sections = Section.objects.filter(test=test)

        subject_map = {}
        for section in sections:
            subject_name = section.course_subject.subject.name
            subject_map.setdefault(subject_name, []).append(section)

        # SUBJECT LOOP (Math + English)
        for subject_name, subject_sections in subject_map.items():

            section_1_correct = 0
            section_2_correct = 0

            for section in subject_sections:
                for sub_section in section.sub_sections:

                    correct_count = QuestionAnswer.objects.filter(
                        result=result,
                        course_subject=section.course_subject,
                        section_id=sub_section["id"],
                        is_correct=True
                    ).count()

                    # SAME SPLIT AS result/details
                    if sub_section["id"] == 1:
                        section_1_correct += correct_count
                    else:
                        section_2_correct += correct_count

            score_record = CombinedScore.objects.filter(
                subject_name__iexact=subject_name,
                section1_correct=section_1_correct,
                section2_correct=section_2_correct
            ).first()

            if score_record:
                total_score += score_record.total_score

        return total_score



class RecentPracticeTestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name')
    test_name = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course_subject.course.name')
    total_score = serializers.IntegerField(source='result.correct_answer_count')
    created_at = serializers.DateTimeField()

    class Meta:
        model = PracticeTest
        fields = [
            'id',
            'student_name',
            'test_name',
            'course_name',
            'total_score',
            'created_at'
        ]

    def get_test_name(self, obj):
        return f"Practice Test - {obj.id}"

