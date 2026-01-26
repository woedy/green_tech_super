from construction.models import ConstructionRequest
from accounts.models import User

# Get the user that's likely logged in (based on the logs showing user17@example.com)
user = User.objects.filter(email='user17@example.com').first()
print(f'Current user: {user.username if user else "None"} - ID: {user.id if user else "None"}')

if user:
    # Assign some construction requests to this user
    unassigned_requests = ConstructionRequest.objects.filter(client__isnull=True)[:5]
    print(f'Found {unassigned_requests.count()} unassigned requests')
    
    for req in unassigned_requests:
        req.client = user
        req.save()
        print(f'Assigned request "{req.title}" to {user.username}')

# Verify the assignment
print('\nUpdated requests for user:')
for req in ConstructionRequest.objects.filter(client=user):
    print(f'Request: {req.title} - Status: {req.status} - ID: {req.id}')
