from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('system_manager', '0026_doubtcomment_admin_unread'),
    ]

    operations = [
        migrations.AddField(
            model_name='doubtcomment',
            name='student_unread',
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
