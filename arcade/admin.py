from django.contrib import admin

from .models import GameScore, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "profile_picture")
    search_fields = ("user__username", "user__email")


@admin.register(GameScore)
class GameScoreAdmin(admin.ModelAdmin):
    list_display = ("user", "game", "score", "created_at")
    list_filter = ("game", "created_at")
    search_fields = ("user__username",)
    ordering = ("-score",)
