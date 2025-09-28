from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class SiteDocumentCategory(models.TextChoices):
    LEGAL = 'legal', _('Legal')
    CONTACT = 'contact', _('Contact')
    GENERAL = 'general', _('General')


class SiteDocument(models.Model):
    slug = models.SlugField(_('slug'), max_length=80, unique=True)
    title = models.CharField(_('title'), max_length=150)
    category = models.CharField(_('category'), max_length=20, choices=SiteDocumentCategory.choices, default=SiteDocumentCategory.GENERAL)
    description = models.CharField(_('description'), max_length=255, blank=True)
    current_version = models.ForeignKey('SiteDocumentVersion', related_name='+', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        ordering = ('category', 'title')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title

    @property
    def published_content(self) -> str:
        if self.current_version and self.current_version.status == DocumentStatus.PUBLISHED:
            return self.current_version.body
        return ''


class DocumentStatus(models.TextChoices):
    DRAFT = 'draft', _('Draft')
    PUBLISHED = 'published', _('Published')
    ARCHIVED = 'archived', _('Archived')


class SiteDocumentVersion(models.Model):
    document = models.ForeignKey(SiteDocument, related_name='versions', on_delete=models.CASCADE)
    version = models.PositiveIntegerField(_('version'))
    status = models.CharField(_('status'), max_length=20, choices=DocumentStatus.choices, default=DocumentStatus.DRAFT)
    title = models.CharField(_('title'), max_length=150)
    summary = models.CharField(_('summary'), max_length=255, blank=True)
    body = models.TextField(_('body'))
    preview_url = models.URLField(_('preview url'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='site_document_versions', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.CharField(_('notes'), max_length=255, blank=True)

    class Meta:
        ordering = ('-created_at',)
        unique_together = ('document', 'version')

    def save(self, *args, **kwargs):
        if not self.version:
            last_version = (
                SiteDocumentVersion.objects.filter(document=self.document)
                .order_by('-version')
                .first()
            )
            self.version = 1 if not last_version else last_version.version + 1
        super().save(*args, **kwargs)
        if self.status == DocumentStatus.PUBLISHED:
            SiteDocumentVersion.objects.filter(document=self.document, status=DocumentStatus.PUBLISHED).exclude(id=self.id).update(status=DocumentStatus.ARCHIVED)
            SiteDocument.objects.filter(id=self.document_id).update(current_version=self)
        elif not self.document.current_version:
            SiteDocument.objects.filter(id=self.document_id).update(current_version=self)

    def promote_to_published(self):
        self.status = DocumentStatus.PUBLISHED
        self.save(update_fields=['status'])

    def __str__(self) -> str:
        return f"{self.document.title} v{self.version} ({self.get_status_display()})"
