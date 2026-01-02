# Generated migration to make build_request nullable for consolidation

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0003_merge_0002_consolidate_quote_systems_0002_quote_chat'),
        ('plans', '0001_initial'),
    ]

    operations = [
        # Make build_request nullable to support construction project quotes
        migrations.AlterField(
            model_name='quote',
            name='build_request',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='quotes',
                to='plans.buildrequest'
            ),
        ),
    ]