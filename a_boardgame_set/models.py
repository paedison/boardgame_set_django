from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Card(models.Model):
    COLOR_CHOICES = [('red', 'Red'), ('green', 'Green'), ('purple', 'Purple')]
    SHAPE_CHOICES = [('oval', 'Oval'), ('squiggle', 'Squiggle'), ('diamond', 'Diamond')]
    COUNT_CHOICES = [(1, 'One'), (2, 'Two'), (3, 'Three')]
    FILL_CHOICES = [('open', 'Open'), ('striped', 'Striped'), ('solid', 'Solid')]

    color = models.CharField(max_length=10, choices=COLOR_CHOICES)
    shape = models.CharField(max_length=10, choices=SHAPE_CHOICES)
    count = models.IntegerField(choices=COUNT_CHOICES)
    fill = models.CharField(max_length=10, choices=FILL_CHOICES)

    def __str__(self):
        return ' '.join([
            self.get_color_display(),
            self.get_shape_display(),
            self.get_count_display(),
            self.get_fill_display(),
        ])

    def get_image_filename(self):
        return f'{self.color}_{self.shape}_{self.count}_{self.fill}.png'

    def to_dict(self):
        return {
            "id": self.id,
            "shape": self.shape,
            "color": self.color,
            "count": self.count,
            "fill": self.fill,
        }


class GameSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)
    finished = models.BooleanField(default=False)
