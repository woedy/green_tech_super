from construction.models import ConstructionRequest
from accounts.models import User

print('Total construction requests:', ConstructionRequest.objects.count())
print('Total users:', User.objects.count())

print('\nAll construction requests:')
for req in ConstructionRequest.objects.all():
    print(f'Request: {req.title} - Client: {req.client.username if req.client else "None"} - Status: {req.status} - ID: {req.id}')

print('\nAll users:')
for user in User.objects.all():
    print(f'User: {user.username} - Email: {user.email} - ID: {user.id}')
