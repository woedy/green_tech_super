# Generated migration to remove redundant quote models from construction app

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('construction', '0001_initial'),
        ('quotes', '0004_make_build_request_nullable'),  # Ensure consolidation is complete
    ]

    operations = [
        # First remove field references to quote models
        migrations.RemoveField(
            model_name='project',
            name='approved_quote',
        ),
        migrations.RemoveField(
            model_name='projectchatmessage',
            name='quote',
        ),
        
        # Then remove quote-related models since they're now consolidated in quotes app
        migrations.DeleteModel(
            name='QuoteChangeLog',
        ),
        migrations.DeleteModel(
            name='QuoteItem',
        ),
        migrations.DeleteModel(
            name='Quote',
        ),
    ]