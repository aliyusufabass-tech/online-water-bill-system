from django.shortcuts import render


def spa_view(request):
    return render(request, 'core/index.html')
