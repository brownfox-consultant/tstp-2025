import pandas as pd
from django.core.management.base import BaseCommand

from course_manager.models import CombinedScore


class Command(BaseCommand):
    help = 'Load scoring data from CSV file'

    def handle(self, *args, **kwargs):
        file_path = '/Users/harsh/Desktop/sat_score_sheet/english_score.csv'
        csv_data = pd.read_csv(file_path)

        for index, row in csv_data.iterrows():
            for col in csv_data.columns[1:]:  # Exclude 'Questions' and 'Section-2' columns
                CombinedScore.objects.create(
                    subject_name='English',
                    section1_correct=int(row['Questions']),
                    section2_correct=int(col),
                    total_score=int(row[col])
                )
        print('Data loaded successfully')
