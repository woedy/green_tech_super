from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.SlugField(max_length=80, unique=True, verbose_name='slug')),
                ('title', models.CharField(max_length=150, verbose_name='title')),
                ('category', models.CharField(choices=[('legal', 'Legal'), ('contact', 'Contact'), ('general', 'General')], default='general', max_length=20, verbose_name='category')),
                ('description', models.CharField(blank=True, max_length=255, verbose_name='description')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
            ],
            options={
                'ordering': ('category', 'title'),
            },
        ),
        migrations.CreateModel(
            name='SiteDocumentVersion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('version', models.PositiveIntegerField(verbose_name='version')),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('published', 'Published'), ('archived', 'Archived')], default='draft', max_length=20, verbose_name='status')),
                ('title', models.CharField(max_length=150, verbose_name='title')),
                ('summary', models.CharField(blank=True, max_length=255, verbose_name='summary')),
                ('body', models.TextField(verbose_name='body')),
                ('preview_url', models.URLField(blank=True, verbose_name='preview url')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('notes', models.CharField(blank=True, max_length=255, verbose_name='notes')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='site_document_versions', to=settings.AUTH_USER_MODEL)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='versions', to='sitecontent.sitedocument')),
            ],
            options={
                'ordering': ('-created_at',),
                'unique_together': {('document', 'version')},
            },
        ),
        migrations.AddField(
            model_name='sitedocument',
            name='current_version',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='sitecontent.sitedocumentversion'),
        ),
    ]
