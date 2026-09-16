from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
    path("snake/", views.snake, name="snake"),
    path("asteroid-destroyers/", views.asteroid_destroyers, name="asteroid_destroyers"),
    path("tetris/", views.tetris, name="tetris"),
    path("account/", views.account, name="account"),
    path("profile/", views.profile, name="profile"),
    path("logout/", views.logout_view, name="logout"),
    path("scores/snake/", views.save_score, name="save_score"),
]
