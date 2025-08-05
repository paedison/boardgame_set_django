import random

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .logic.hint import find_possible_sets
from .logic.validator import is_valid_set
from .models import Card
from .serializers import CardSerializer

deck = list(Card.objects.all())
current_cards = []


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
    global deck, current_cards

    card_ids = request.data.get('cardIds', [])
    selected_cards = Card.objects.filter(id__in=card_ids)

    new_cards = []
    if is_valid_set(selected_cards):
        for card in selected_cards:
            current_cards.remove(card)

        new_cards = random.sample(deck, 3)
        current_cards.extend(list(new_cards))
        for card in new_cards:
            deck.remove(card)

    serializer = CardSerializer(new_cards, many=True)
    return Response({'newCards': serializer.data})


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

    response_dict['newCards'] = [card.to_dict() for card in current_cards]
    return Response(response_dict)
