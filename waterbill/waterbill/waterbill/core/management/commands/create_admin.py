import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update a Django superuser from environment variables."

    def handle(self, *args, **options):
        username = os.getenv("ADMIN_USERNAME")
        email = os.getenv("ADMIN_EMAIL")
        password = os.getenv("ADMIN_PASSWORD")

        if not username or not email or not password:
            self.stdout.write("ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping admin creation.")
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(f"Created admin user '{username}'.")
            return

        changed = False
        if user.email != email:
            user.email = email
            changed = True
        if not user.is_staff or not user.is_superuser:
            user.is_staff = True
            user.is_superuser = True
            changed = True

        if changed:
            user.save()

        # Always set password to the provided value to keep Render build deterministic.
        user.set_password(password)
        user.save()
        self.stdout.write(f"Updated admin user '{username}'.")
