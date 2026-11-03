from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('system_manager', '0025_doubtcomment'),
    ]

    operations = [
        migrations.AddField(
            model_name='doubtcomment',
            name='admin_unread',
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
