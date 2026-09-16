import json

from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.db.models import Max
from django.http import JsonResponse
from django.shortcuts import redirect, render

from .forms import ProfileForm
from .models import GameScore, Profile


def home(request):
    return render(request, "home.html")


def leaderboard(request):
    leaderboard_games = {}
    seen_players = set()
    scores = GameScore.objects.select_related("user", "user__profile").order_by("game", "-score", "created_at")
    for score in scores:
        player_key = (score.game, score.user_id)
        if player_key in seen_players:
            continue
        seen_players.add(player_key)
        profile, _ = Profile.objects.get_or_create(user=score.user)
        leaderboard_games.setdefault(score.game, []).append(
            {
                "rank": len(leaderboard_games.get(score.game, [])) + 1,
                "username": score.user.username,
                "score": score.score,
                "profile": profile,
            }
        )
    return render(request, "leaderboard.html", {"leaderboard_games": leaderboard_games})


def snake(request):
    user_score = 0
    if request.user.is_authenticated:
        user_score = (
            GameScore.objects.filter(user=request.user, game="snake")
            .order_by("-score")
            .values_list("score", flat=True)
            .first()
            or 0
        )
    global_score = GameScore.objects.filter(game="snake").values_list("score", flat=True).first() or 0
    return render(request, "snake.html", {"user_score": user_score, "global_score": global_score})


def asteroid_destroyers(request):
    user_score = (
        GameScore.objects.filter(user=request.user, game="asteroid_destroyers")
        .order_by("-score")
        .values_list("score", flat=True)
        .first()
        or 0
    ) if request.user.is_authenticated else 0
    global_score = GameScore.objects.filter(game="asteroid_destroyers").values_list("score", flat=True).first() or 0
    return render(request, "asteroid_destroyers.html", {"user_score": user_score, "global_score": global_score})


def tetris(request):
    return render(request, "tetris.html")


def account(request):
    login_form = AuthenticationForm(request)
    register_form = UserCreationForm()
    if request.method == "POST":
        form_type = request.POST.get("form_type")
        if form_type == "login":
            login_form = AuthenticationForm(request, data=request.POST)
            if login_form.is_valid():
                login(request, login_form.get_user())
                return redirect(request.POST.get("next") or "home")
        elif form_type == "register":
            register_form = UserCreationForm(request.POST)
            if register_form.is_valid():
                user = register_form.save()
                login(request, user)
                return redirect(request.POST.get("next") or "home")
    return render(request, "account.html", {"login_form": login_form, "register_form": register_form})


@login_required
def profile(request):
    user_profile, _ = Profile.objects.get_or_create(user=request.user)
    if request.method == "POST":
        profile_form = ProfileForm(request.POST, request.FILES, instance=user_profile)
        if profile_form.is_valid():
            profile_form.save()
            return redirect("profile")
    else:
        profile_form = ProfileForm(instance=user_profile)
    game_scores = {
        game: score
        for game, score in GameScore.objects.filter(user=request.user)
        .values_list("game")
        .annotate(score=Max("score"))
    }
    return render(request, "profile.html", {"profile_form": profile_form, "game_scores": game_scores})


@login_required
def logout_view(request):
    if request.method == "POST":
        logout(request)
    return redirect("home")


@login_required
def save_score(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required."}, status=405)
    try:
        payload = json.loads(request.body)
        score = int(payload.get("score", 0))
        game = payload.get("game", "snake")
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "Score must be a number."}, status=400)
    if game not in {"snake", "asteroid_destroyers"}:
        return JsonResponse({"error": "Unknown game."}, status=400)
    if score < 0 or score > 1000000:
        return JsonResponse({"error": "Score is out of range."}, status=400)
    existing_best = (
        GameScore.objects.filter(user=request.user, game=game)
        .order_by("-score")
        .values_list("score", flat=True)
        .first()
        or 0
    )
    if score > existing_best:
        GameScore.objects.create(user=request.user, game=game, score=score)
    user_best = max(existing_best, score)
    global_best = GameScore.objects.filter(game=game).values_list("score", flat=True).first() or user_best
    return JsonResponse({"user_score": user_best, "global_score": global_best})
