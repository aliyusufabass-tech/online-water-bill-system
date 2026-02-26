from decimal import Decimal

from django.db import migrations, models


def _populate_meter_numbers_and_amounts(apps, schema_editor):
    SystemProfile = apps.get_model('core', 'SystemProfile')
    Bill = apps.get_model('core', 'Bill')

    prefix = 'MTR'
    next_number = 1

    for profile in SystemProfile.objects.order_by('id'):
        if not profile.meter_number:
            profile.meter_number = f'{prefix}{next_number:06d}'
            next_number += 1
            profile.save(update_fields=['meter_number'])

    for bill in Bill.objects.all():
        bill.amount_due = (bill.meter_reading or Decimal('0.00')) * Decimal('100.00')
        bill.save(update_fields=['amount_due'])


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_alter_systemprofile_created_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemprofile',
            name='meter_number',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.RunPython(_populate_meter_numbers_and_amounts, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='systemprofile',
            name='meter_number',
            field=models.CharField(blank=True, max_length=20, unique=True),
        ),
    ]
