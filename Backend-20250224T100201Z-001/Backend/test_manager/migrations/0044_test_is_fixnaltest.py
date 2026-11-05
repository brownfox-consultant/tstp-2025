from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('test_manager', '0043_alter_practicetestresult_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='test',
            name='is_fixnaltest',
            field=models.BooleanField(default=False),
        ),
    ]
