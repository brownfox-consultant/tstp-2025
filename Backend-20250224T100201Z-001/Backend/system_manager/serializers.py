from rest_framework import serializers

from course_manager.models import Topic, Question, SubTopic
from course_manager.serializers import QuestionListSerializer
from system_manager.models import Doubt, Issue, Concern, Meeting, Suggestion, StudentFeedback
from test_manager.models import TestSubmission, Result
from django.utils import timezone
from course_manager.models import Question, CourseSubjects, Topic, SubTopic
from test_manager.models import Test


# class RaiseDoubtSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Doubt
#         exclude = ('faculty', 'status', 'resolution', 'resolution_date', 'faculty_assigned_date')

class RaiseDoubtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doubt
        exclude = ('faculty', 'status', 'resolution', 'resolution_date', 'faculty_assigned_date')

    test = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=Test.objects.all())
    course_subject = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=CourseSubjects.objects.all())
    section = serializers.IntegerField(required=False, allow_null=True)

class AssignFacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Doubt
        fields = ['faculty']


class ResolveDoubtSerializer(serializers.ModelSerializer):
    resolved_by = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Doubt
        fields = ['resolution', 'resolved_by']

    def get_resolved_by(self, obj):
        return obj.resolved_by.name if obj.resolved_by else None

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            instance.resolved_by = request.user
        instance.resolution = validated_data.get('resolution', instance.resolution)
        instance.status = Doubt.RESOLVED
        instance.resolution_date = instance.resolution_date or timezone.now()
        instance.save()
        return instance



class DoubtListSerializer(serializers.ModelSerializer):
    test = serializers.SerializerMethodField()
    test_type = serializers.SerializerMethodField()

    student = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    resolved_by = serializers.SerializerMethodField()
    question = serializers.SerializerMethodField()

    created_at = serializers.SerializerMethodField()
    faculty_assigned_date = serializers.SerializerMethodField()
    resolution_date = serializers.SerializerMethodField()

    class Meta:
        model = Doubt
        fields = ['id', 'test','test_type', 'student', 'faculty','resolved_by', 'question', 'description', 'status', 'resolution',
                  'created_at', 'faculty_assigned_date', 'resolution_date']

    def get_test(self, obj):
        if obj.test:
            return obj.test.name

        # fallback using question
        if hasattr(obj.question, "test_type"):
            return obj.question.test_type  # or a custom display text

        return None

    def get_test_type(self, obj):
        if obj.test:
            return obj.test.test_type

        if hasattr(obj.question, "test_type"):
            return obj.question.test_type

        return None
    def get_created_at(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M:%S%z') if obj.created_at else None

    def get_faculty_assigned_date(self, obj):
        return obj.faculty_assigned_date.strftime('%Y-%m-%d %H:%M:%S%z') if obj.faculty_assigned_date else None

    def get_resolution_date(self, obj):
        return obj.resolution_date.strftime('%Y-%m-%d %H:%M:%S%z') if obj.resolution_date else None


    def get_student(self, obj):
        return obj.student.name

    def get_faculty(self, obj):
        if obj.faculty is not None:
            return obj.faculty.name
        return None
    
    def get_resolved_by(self, obj):
        return obj.resolved_by.name if obj.resolved_by else None

    def get_question(self, obj):
        question = obj.question

        if not question:
            return None

        # Default values
        selected_option_index = None
        is_skipped = True  # assume skipped unless found

        # Try to find student's test result for context
        test_submission = TestSubmission.objects.filter(test_id=obj.test, student=obj.student).first()
        if test_submission:
            result = Result.objects.filter(test_submission=test_submission).first()
            if result:
                try:
                    answers = result.detailed_view.get("answers", {})
                    course_answers = answers.get(str(obj.course_subject.id), {})
                    section_data = course_answers.get(str(obj.section), {})
                    questions_answered = section_data.get("questions_answered", {})
                    question_data = questions_answered.get(str(question.id))

                    if question_data:
                        selected_option_index = question_data.get('selected_option_index')
                        is_skipped = question_data.get('is_skipped', True)

                except Exception:
                    pass  # keep defaults

        question_data = {
            'id': question.id,
            'description': question.description,
            'is_skipped': is_skipped,
            'options': [],
        }

        for index, option in enumerate(question.options):
            if isinstance(option, dict):
                option_data = {
                    'description': option.get('description', ''),
                    'is_correct': option.get('is_correct', False),
                    'selected_by_user': False if is_skipped else index == selected_option_index
                }
            else:
                option_data = {
                    'description': option,
                    'is_correct': False,
                    'selected_by_user': False if is_skipped else index == selected_option_index
                }

            question_data['options'].append(option_data)

        return question_data



class IssueSerializer(serializers.ModelSerializer):
    student = serializers.CharField(source="student.name", read_only=True)
    resolved_by = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    resolution_date = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id',
            'student',
            'description',
            'status',
            'resolution',
            'created_at',
            'resolution_date',
            'resolved_by',
        ]

    def get_created_at(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M:%S%z') if obj.created_at else None

    def get_resolution_date(self, obj):
        return obj.resolution_date.strftime('%Y-%m-%d %H:%M:%S%z') if obj.resolution_date else None

    def get_resolved_by(self, obj):
        return obj.resolved_by.name if obj.resolved_by else None



class RaiseIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['student', 'description', 'status']


class IssueResolveSerializer(serializers.ModelSerializer):
    resolved_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Issue
        fields = ['resolution', 'resolved_by']



class ConcernSerializer(serializers.ModelSerializer):
    parent = serializers.SerializerMethodField()

    class Meta:
        model = Concern
        fields = ['id', 'description', 'parent', 'status', 'resolution', 'resolution_date', 'created_at']

    def get_parent(self, obj):
        return obj.parent.name


class RaiseConcernSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concern
        fields = ['parent', 'description', 'status']


class ConcernResolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concern
        fields = ['resolution']


class ScheduleMeetingSerializer(serializers.ModelSerializer):
    requested_times = serializers.ListField(
        child=serializers.DateTimeField(format='%Y-%m-%d %H:%M', input_formats=['%Y-%m-%d %H:%M']),
        allow_empty=False,
        max_length=3,
        min_length=1,
        help_text="List of up to 3 preferred meeting times"
    )

    class Meta:
        model = Meeting
        fields = ['requested_by', 'description', 'requested_times', 'status']



class ApproveMeetingSerializer(serializers.ModelSerializer):
    approved_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M', input_formats=['%Y-%m-%d %H:%M', ])

    class Meta:
        model = Meeting
        fields = ['approved_time', 'status']


class MeetingSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='requested_by.email')
    phone_number = serializers.CharField(source='requested_by.phone_number')
    requested_by = serializers.CharField(source='requested_by.name', read_only=True)
    requested_times = serializers.ListField(
        child=serializers.DateTimeField(format='%Y-%m-%d %H:%M')
    )
    approved_time = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M', input_formats=['%Y-%m-%d %H:%M'], required=False, allow_null=True
    )

    class Meta:
        model = Meeting
        fields = [
            'id', 'description', 'requested_by', 'email', 'phone_number',
            'requested_times', 'status', 'approved_time'
        ]
        read_only_fields = ['status']


class CreateSuggestionOptionSerializer(serializers.Serializer):
    def to_internal_value(self, data):
        # Depending on the context, handle as list of strings or list of dicts
        question_type = self.context.get('question_type')
        if question_type == Question.FILL_IN_BLANKS:
            # Expect data to be just the answer string
            return data
        else:
            # For other question types, expect data as a dictionary
            return {
                'description': data.get('description'),
                'is_correct': data.get('is_correct', False)
            }

    def to_representation(self, instance):
        # Handle representation based on instance type (string or dict)
        if isinstance(instance, str):
            return instance  # for fill in the blanks
        else:
            return {  # for other question types
                'description': instance['description'],
                'is_correct': instance.get('is_correct', False)
            }


class CreateSuggestionSerializer(serializers.ModelSerializer):
    options = serializers.JSONField()
    topic = serializers.CharField(write_only=True)
    sub_topic = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Suggestion
        fields = ['id', 'question', 'description', 'reading_comprehension_passage', 'options', 'question_type',
                  'question_subtype', 'topic',
                  'sub_topic', 'difficulty', 'test_type', 'status', 'created_by', 'show_calculator', 'directions',
                  'explanation']

    def validate(self, data):
        if data['question_type'] in [Question.MCQ]:
            # Validation logic for different question types
            if data['question_subtype'] == Question.MCQ_READING_COMPREHENSION and not data.get(
                    'reading_comprehension_passage'):
                raise serializers.ValidationError("Reading comprehension passage is required.")
            elif data['question_subtype'] == Question.FILL_IN_BLANKS:
                # Validate that options are a list of strings for fill in the blanks
                if not isinstance(data.get('options', []), list) or not all(
                        isinstance(opt, str) for opt in data['options']):
                    raise serializers.ValidationError("Options for fill in the blanks must be a list of strings.")
            elif data['question_subtype'] in [Question.MCQ_SINGLE_CHOICE_QUESTION, Question.MCQ_MULTI_CHOICE_QUESTION,
                                              Question.MCQ_READING_COMPREHENSION]:
                # Validate that at least one option is marked as correct for choice questions
                correct_options = [opt for opt in data.get('options', []) if opt.get('is_correct')]
                if not correct_options:
                    raise serializers.ValidationError("At least one option must be marked as correct.")

        elif data['question_type'] in [Question.GRIDIN]:
            value = data.get('options', [])

            # Validation logic for different question types
            if data['question_subtype'] == Question.GRIDIN_SINGLE_ANSWER and not value and not len(value) == 1:
                raise serializers.ValidationError(
                    {f"{Question.GRIDIN_SINGLE_ANSWER}": "should have At least single Answer."})

            elif data['question_subtype'] == Question.GRIDIN_MULTI_ANSWER and not value and len(value) < 2:
                raise serializers.ValidationError(
                    {f"{Question.GRIDIN_MULTI_ANSWER}": "At least two or more answer are required."})

            elif data['question_subtype'] == Question.GRIDIN_RANGE_BASED_ANSWER:

                if not isinstance(value, list):
                    raise serializers.ValidationError("Range based answer must be a list of expressions.")

                for expression in value:
                    if not isinstance(expression, dict):
                        raise serializers.ValidationError(
                            {f"{Question.GRIDIN_RANGE_BASED_ANSWER}": "Each expression must be a dictionary"})

                for key in expression:
                    if key not in Question.operator_mapper.keys():
                        formated_operator_str = ",".join(list(Question.operator_mapper.keys()))
                        raise serializers.ValidationError(
                            f"""Invalid expression type '{key}'. Valid expression are {formated_operator_str}""")

        return data

    def create(self, validated_data):
        topic_name = validated_data.pop('topic')
        sub_topic_name = validated_data.pop('sub_topic', None)

        question = validated_data['question']

        topic, _ = (Topic.objects.get_or_create(name=topic_name, course_subject=question.course_subject))
        sub_topic = None
        if sub_topic_name:
            sub_topic, _ = SubTopic.objects.get_or_create(name=sub_topic_name, topic=topic)

        suggestion = Suggestion.objects.create(**validated_data, topic=topic, sub_topic=sub_topic)
        return suggestion


class SuggestionListSerializer(serializers.ModelSerializer):
    question = QuestionListSerializer()
    course = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    suggestion = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = Suggestion
        fields = [
            'id', 'course', 'subject', 'question', 'suggestion', 
            'status', 'created_by', 'created_at', 'show_calculator'
        ]

    def get_suggestion(self, obj):
        return {
            'description': obj.description,
            'reading_comprehension_passage': obj.reading_comprehension_passage,
            'question_type': obj.question_type,
            'question_subtype': obj.question_subtype,
            'options': obj.options,
            'topic': obj.topic.name if obj.topic else None,
            'sub_topic': obj.sub_topic.name if obj.sub_topic else None,
            'difficulty': obj.difficulty,
            'test_type': obj.test_type,
            'show_calculator': obj.show_calculator,
            'directions': obj.directions,
            'explanation': obj.explanation
        }

    def get_created_by(self, obj):
        return obj.created_by.username if obj.created_by else "Unknown"


    def get_course(self, obj):
        return obj.question.course_subject.course.name

    def get_subject(self, obj):
        return obj.question.course_subject.subject.name if obj.question.course_subject and obj.question.course_subject.subject else None    

    def get_created_by(self, obj):
        return obj.created_by.name


class CreateStudentFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentFeedback
        fields = ['student', 'created_by', 'description']


class StudentFeedbackSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = StudentFeedback
        fields = ['id', 'student', 'description', 'created_by', 'created_at']

    def get_created_at(self, obj):
        return obj.created_at.strftime('%b %d, %Y') if obj.created_at else None

    def get_student(self, obj):
        return obj.student.name

    def get_created_by(self, obj):
        return obj.created_by.name
