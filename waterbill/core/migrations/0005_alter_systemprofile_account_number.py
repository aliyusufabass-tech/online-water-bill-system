from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_systemprofile_meter_number_and_recalculate_bills'),
    ]

    operations = [
        migrations.AlterField(
            model_name='systemprofile',
            name='account_number',
            field=models.CharField(blank=True, max_length=20, unique=True),
        ),
    ]
