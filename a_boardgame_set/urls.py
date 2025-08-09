from django.urls import path
from . import views

urlpatterns = [
    path('draw/', views.draw_card, name='draw-card'),
    path('validate/', views.validate_set, name='validate-set'),
    path('hint/', views.show_hint, name='show-hint'),
]
