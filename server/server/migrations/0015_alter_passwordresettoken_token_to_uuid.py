from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('server', '0014_remove_groupsession_time_group_target_hours_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='token',
            field=models.UUIDField(default=None, unique=True, null=True),
        ),
    ] 