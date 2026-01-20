import json
from collections import defaultdict

def validate_add_question_request(request):
    data = request.data

    required_fields = ['course_subject_id', 'description', 'options']
    for required_field in required_fields:
        if data.get(required_field) is None:
            raise Exception(f'{required_field} is mandatory')



def build_question_availability_map(questions):
    """
    SAME question = description + options + topic + sub_topic
    Availability is computed ACROSS ALL COURSES.
    """
    signature_map = defaultdict(list)

    for q in questions:
        signature = (
            q.description,
            json.dumps(q.options, sort_keys=True),
            q.topic.name if q.topic else None,
            q.sub_topic.name if q.sub_topic else None
        )

        signature_map[signature].append({
            'course': q.course_subject.course.name,
            'subject': q.course_subject.subject.name,
            'course_subject_id': q.course_subject.id
        })

    return signature_map

def get_question_signature(question):
    return (
        question.description,
        json.dumps(question.options, sort_keys=True),
        question.topic.name if question.topic else None,
        question.sub_topic.name if question.sub_topic else None
    )


