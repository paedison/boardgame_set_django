from django.urls import path
from . import views

urlpatterns = [
    path('start/', views.start_game, name='start-game'),
    path('cards/', views.get_cards, name='card-list'),
    path('validate/', views.validate_set, name='validate-set'),
    path('hint/', views.show_hint, name='show-hint'),
]
