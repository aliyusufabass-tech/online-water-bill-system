import base64
import binascii
import hashlib
import hmac
import json

from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import authentication
from rest_framework import exceptions


def _b64url_encode(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode('ascii')


def _b64url_decode(raw):
    padded = raw + '=' * (-len(raw) % 4)
    return base64.urlsafe_b64decode(padded.encode('ascii'))


def jwt_encode(payload):
    header = {'alg': 'HS256', 'typ': 'JWT'}
    header_part = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_part = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signing_input = f'{header_part}.{payload_part}'.encode('ascii')
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode('utf-8'),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f'{header_part}.{payload_part}.{_b64url_encode(signature)}'


def jwt_decode(token):
    parts = token.split('.')
    if len(parts) != 3:
        return None

    header_part, payload_part, signature_part = parts
    signing_input = f'{header_part}.{payload_part}'.encode('ascii')
    expected_signature = hmac.new(
        settings.JWT_SECRET_KEY.encode('utf-8'),
        signing_input,
        hashlib.sha256,
    ).digest()

    try:
        provided_signature = _b64url_decode(signature_part)
    except (ValueError, binascii.Error):
        return None

    if not hmac.compare_digest(expected_signature, provided_signature):
        return None

    try:
        payload = json.loads(_b64url_decode(payload_part).decode('utf-8'))
    except (ValueError, json.JSONDecodeError, binascii.Error):
        return None

    exp = payload.get('exp')
    if exp is None:
        return None

    if int(timezone.now().timestamp()) >= int(exp):
        return None

    return payload


def build_tokens(user):
    now_ts = int(timezone.now().timestamp())
    access_payload = {
        'sub': str(user.id),
        'type': 'access',
        'is_staff': user.is_staff,
        'iat': now_ts,
        'exp': now_ts + settings.JWT_ACCESS_LIFETIME_SECONDS,
    }
    refresh_payload = {
        'sub': str(user.id),
        'type': 'refresh',
        'iat': now_ts,
        'exp': now_ts + settings.JWT_REFRESH_LIFETIME_SECONDS,
    }
    return {'access': jwt_encode(access_payload), 'refresh': jwt_encode(refresh_payload)}


class JWTAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith(f'{self.keyword} '):
            return None

        token = auth_header.split(' ', 1)[1].strip()
        payload = jwt_decode(token)
        if not payload or payload.get('type') != 'access':
            raise exceptions.AuthenticationFailed('Invalid or expired token.')

        user = User.objects.filter(id=payload.get('sub')).first()
        if not user:
            raise exceptions.AuthenticationFailed('User not found.')

        return (user, None)
