import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='CustomerProfile',
            new_name='SystemProfile',
        ),
        migrations.RenameModel(
            old_name='WaterBill',
            new_name='Bill',
        ),
        migrations.AddField(
            model_name='systemprofile',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='systemprofile',
            name='full_name',
            field=models.CharField(default='Unknown User', max_length=120),
            preserve_default=False,
        ),
        migrations.RemoveField(
            model_name='bill',
            name='current_reading',
        ),
        migrations.RemoveField(
            model_name='bill',
            name='is_paid',
        ),
        migrations.RemoveField(
            model_name='bill',
            name='previous_reading',
        ),
        migrations.AddField(
            model_name='bill',
            name='meter_reading',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='bill',
            name='status',
            field=models.CharField(
                choices=[('unpaid', 'Unpaid'), ('pending', 'Pending'), ('paid', 'Paid'), ('rejected', 'Rejected')],
                default='unpaid',
                max_length=20,
            ),
        ),
        migrations.RenameField(
            model_name='payment',
            old_name='amount_paid',
            new_name='amount',
        ),
        migrations.AddField(
            model_name='payment',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='reviewed_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='reviewed_payments',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='payment',
            name='status',
            field=models.CharField(
                choices=[('approved', 'Approved'), ('pending', 'Pending'), ('rejected', 'Rejected')],
                default='pending',
                max_length=20,
            ),
        ),
    ]
