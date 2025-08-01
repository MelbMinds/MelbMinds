# Generated by Django 5.1.5 on 2025-07-16 04:45

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0015_alter_passwordresettoken_token_to_uuid'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='token',
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),
    ]
