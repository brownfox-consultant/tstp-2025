from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('test_manager', '0044_test_is_fixnaltest'),
    ]

    operations = [
        migrations.RenameField(
            model_name='test',
            old_name='is_SectionalTest',
            new_name='is_sectional_test',
        ),
    ]
