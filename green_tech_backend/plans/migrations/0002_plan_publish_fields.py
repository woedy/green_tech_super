from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plans', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='plan',
            name='published_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='published at'),
        ),
        migrations.AlterField(
            model_name='plan',
            name='is_published',
            field=models.BooleanField(default=False, verbose_name='is published'),
        ),
        migrations.AlterField(
            model_name='planfeature',
            name='is_sustainable',
            field=models.BooleanField(default=False, verbose_name='is sustainable feature'),
        ),
    ]
