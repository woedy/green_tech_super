import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientCommunication from '@/components/projects/ClientCommunication';
import { ProjectChatMessage } from '@/types/chat';
import { UserSummary } from '@/types/project';

const mockCurrentUser: UserSummary = {
  id: 'agent-1',
  name: 'Agent Smith',
  email: 'agent@greentech.com',
};

const mockMessages: ProjectChatMessage[] = [
  {
    id: 'msg-1',
    project: 'PRJ-001',
    quote: null,
    sender: {
      id: 'client-1',
      name: 'John Client',
      email: 'john@client.com',
    },
    body: 'Hello, how is the project progressing?',
    attachments: [],
    created_at: '2024-03-10T10:00:00Z',
    edited_at: null,
    receipts: [],
  },
  {
    id: 'msg-2',
    project: 'PRJ-001',
    quote: null,
    sender: mockCurrentUser,
    body: 'Hi John! The foundation work is 80% complete. We should finish by Friday.',
    attachments: [],
    created_at: '2024-03-10T10:30:00Z',
    edited_at: null,
    receipts: [],
  },
  {
    id: 'msg-3',
    project: 'PRJ-001',
    quote: null,
    sender: {
      id: 'client-1',
      name: 'John Client',
      email: 'john@client.com',
    },
    body: 'Great! Can you send some photos of the progress?',
    attachments: [],
    created_at: '2024-03-10T11:00:00Z',
    edited_at: null,
    receipts: [],
  },
];

const mockOnSendMessage = vi.fn();

describe('ClientCommunication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSendMessage.mockResolvedValue(undefined);
  });

  it('renders communication interface', () => {
    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText('Client Communication')).toBeInTheDocument();
    expect(screen.getByText('3 messages')).toBeInTheDocument();
  });

  it('displays messages correctly', () => {
    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText('Hello, how is the project progressing?')).toBeInTheDocument();
    expect(screen.getByText('Hi John! The foundation work is 80% complete. We should finish by Friday.')).toBeInTheDocument();
    expect(screen.getByText('Great! Can you send some photos of the progress?')).toBeInTheDocument();
  });

  it('distinguishes between current user and other messages', () => {
    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    // Current user messages should be aligned right (justify-end class)
    const messageContainers = screen.getAllByText(/John Client|Agent Smith/).map(el => 
      el.closest('.flex')
    );

    // Check that messages have different alignments
    expect(messageContainers.some(container => 
      container?.classList.contains('justify-end')
    )).toBe(true);
    expect(messageContainers.some(container => 
      container?.classList.contains('justify-start')
    )).toBe(true);
  });

  it('sends message when form is submitted', async () => {
    const user = userEvent.setup();

    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    const messageInput = screen.getByPlaceholderText('Type your message to the client...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(messageInput, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', true);
    });
  });

  it('sends message with Enter key', async () => {
    const user = userEvent.setup();

    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    const messageInput = screen.getByPlaceholderText('Type your message to the client...');

    await user.type(messageInput, 'Test message{enter}');

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', true);
    });
  });

  it('does not send message with Shift+Enter', async () => {
    const user = userEvent.setup();

    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    const messageInput = screen.getByPlaceholderText('Type your message to the client...');

    await user.type(messageInput, 'Test message{shift>}{enter}{/shift}');

    // Should not send message
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('toggles notification setting', async () => {
    const user = userEvent.setup();

    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    const notificationSwitch = screen.getByRole('switch');
    expect(notificationSwitch).toBeChecked();

    await user.click(notificationSwitch);
    expect(notificationSwitch).not.toBeChecked();

    const messageInput = screen.getByPlaceholderText('Type your message to the client...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(messageInput, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', false);
    });
  });

  it('disables send button when message is empty', () => {
    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when message has content', async () => {
    const user = userEvent.setup();

    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    const messageInput = screen.getByPlaceholderText('Type your message to the client...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(messageInput, 'Test message');
    expect(sendButton).not.toBeDisabled();
  });

  it('shows loading state when no messages', () => {
    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={[]}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('shows empty state when no messages and not loading', () => {
    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={[]}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
        isLoading={false}
      />
    );

    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
  });

  it('formats message timestamps correctly', () => {
    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    // Should show time for recent messages
    expect(screen.getByText(/10:00 AM|10:30 AM|11:00 AM/)).toBeInTheDocument();
  });

  it('clears message input after sending', async () => {
    const user = userEvent.setup();

    render(
      <ClientCommunication
        projectId="PRJ-001"
        messages={mockMessages}
        currentUser={mockCurrentUser}
        onSendMessage={mockOnSendMessage}
      />
    );

    const messageInput = screen.getByPlaceholderText('Type your message to the client...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(messageInput, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });
});