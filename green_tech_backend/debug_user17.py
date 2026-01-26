from accounts.models import User
from construction.models.request import ConstructionRequest

user = User.objects.get(email='user17@example.com')
pending_reqs = ConstructionRequest.objects.filter(client=user, status='PENDING')
print(f'Pending requests for {user.email}: {pending_reqs.count()}')
for req in pending_reqs:
    print(f'  {req.title}: status="{req.status}"')

print()
print('All requests for this user:')
for req in ConstructionRequest.objects.filter(client=user):
    print(f'  {req.title}: status="{req.status}"')
