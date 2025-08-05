import itertools
import random

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .logic.hint import find_possible_sets
from .logic.validator import is_valid_set
from .models import Card
from .serializers import CardSerializer

deck = list(Card.objects.all())
current_cards = []
hint_index = 0


@api_view(['GET'])
def get_cards(request):
    cards = Card.objects.all()
    serializer = CardSerializer(cards, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def start_game(request):
    global deck, current_cards
    deck = list(Card.objects.all())
    current_cards = random.sample(deck, 12)
    for card in current_cards:
        deck.remove(card)
    return Response([card.to_dict() for card in current_cards])


@api_view(['POST'])
def validate_set(request):
    card_ids = request.data.get('card_ids', [])
    cards = Card.objects.filter(id__in=card_ids)
    is_valid = is_valid_set(cards)  # 세트 검증 로직
    return Response({'is_valid_set': is_valid})


@api_view(['GET'])
def show_hint(request):
    global current_cards

    possible_sets = find_possible_sets(current_cards)
    response_dict = {'possible_sets': possible_sets}
    if possible_sets:
        return Response(response_dict)

    # 세트가 없을 경우 → 덱에 현재 카드 복원 후 새로 뽑기
    deck.extend(current_cards)
    current_cards = random.sample(deck, 12)
    for card in current_cards:
        deck.remove(card)

    response_dict['new_cards'] = [card.to_dict() for card in current_cards]
    return Response(response_dict)
#
#
# @api_view(['GET'])
# def show_hint(request):
#     cards = Card.objects.all()
#     sets = find_possible_sets(cards)
#     hint = [[card.id for card in trio] for trio in sets]
#     return Response({'possible_sets': hint})
