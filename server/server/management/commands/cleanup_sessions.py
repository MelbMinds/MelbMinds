from django.core.management.base import BaseCommand
from django.utils import timezone
from server.views import cleanup_past_sessions

class Command(BaseCommand):
    help = 'Clean up past study sessions and create notifications'

    def handle(self, *args, **options):
        deleted_count = cleanup_past_sessions()
        if deleted_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully cleaned up {deleted_count} past session(s)')
            )
        else:
            self.stdout.write(
                self.style.WARNING('No past sessions found to clean up')
            ) 