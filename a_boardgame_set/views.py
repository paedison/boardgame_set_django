import random

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .logic.hint import find_possible_sets
from .logic.validator import is_valid_set
from .models import Card
from .serializers import CardSerializer

deck = []
current_cards = []


@api_view(['GET'])
def draw_card(request):
    global deck, current_cards

    game_start = request.GET.get('game_start', '')
    if game_start:
        deck = list(Card.objects.all())
        # deck = random.sample(deck, 12)

    current_cards = random.sample(deck, 12)
    for card in current_cards:
        deck.remove(card)
    return Response({
        'newCards': [card.to_dict() for card in current_cards],
        'remainingCards': len(deck),
    })


@api_view(['POST'])
def validate_set(request):
    global deck, current_cards

    card_ids = request.data.get('selectedCardIds', [])
    selected_cards = Card.objects.filter(id__in=card_ids)

    response_dict = {'isValidSet': False, 'newCards': [], 'remainingCards': len(deck)}
    if is_valid_set(selected_cards):
        response_dict['isValidSet'] = True
        for card in selected_cards:
            current_cards.remove(card)

        if len(deck) >= 3:
            new_cards = random.sample(deck, 3)
            current_cards.extend(list(new_cards))
            for card in new_cards:
                deck.remove(card)
            serializer = CardSerializer(new_cards, many=True)
            response_dict['newCards'] = serializer.data
            response_dict['remainingCards'] = len(deck)

    return Response(response_dict)


@api_view(['GET'])
def show_hint(request):
    global current_cards

    possible_sets = find_possible_sets(current_cards)
    response_dict = {'possibleSets': possible_sets, 'newCards': []}
    if possible_sets:
        return Response(response_dict)

    # 세트가 없을 경우 → 덱에 현재 카드 복원 후 새로 뽑기
    if deck:
        deck.extend(current_cards)
        current_cards = random.sample(deck, 12)
        for card in current_cards:
            deck.remove(card)
        response_dict['newCards'] = [card.to_dict() for card in current_cards]

    return Response(response_dict)
