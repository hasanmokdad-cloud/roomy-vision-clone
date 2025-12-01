import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useFriendships } from '@/hooks/useFriendships';
import { useFriendSuggestions } from '@/hooks/useFriendSuggestions';
import { FriendRequestCard } from './FriendRequestCard';
import { FriendCard } from './FriendCard';
import { SuggestionCard } from './SuggestionCard';
import { MutualFriendsModal } from './MutualFriendsModal';
import { Users, UserPlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createOrGetConversation } from '@/lib/conversationUtils';
import { supabase } from '@/integrations/supabase/client';

interface FriendsTabProps {
  studentId: string;
  searchQuery?: string;
}

export function FriendsTab({ studentId, searchQuery = '' }: FriendsTabProps) {
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading: friendsLoading,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    sendRequest,
  } = useFriendships(studentId);

  const { suggestions, loading: suggestionsLoading } =
    useFriendSuggestions(studentId);

  const [mutualFriendsModal, setMutualFriendsModal] = useState<{
    open: boolean;
    studentIdA: string;
    studentIdB: string;
  }>({
    open: false,
    studentIdA: '',
    studentIdB: '',
  });

  // Filter based on search query
  const filteredRequests = pendingRequests.filter(fr =>
    fr.requester?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fr.requester?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(fr => {
    const friend = fr.requester_id === studentId ? fr.receiver : fr.requester;
    return (
      friend?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend?.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend?.major?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredSuggestions = suggestions.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.major?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessage = async (friendStudentId: string) => {
    // Get user IDs from student IDs
    const { data: currentUser } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    const { data: friendUser } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', friendStudentId)
      .single();

    if (currentUser && friendUser) {
      const conversationId = await createOrGetConversation(
        currentUser.user_id,
        friendUser.user_id
      );
      navigate(`/messages?conversation=${conversationId}`);
    }
  };

  const handleViewProfile = (friendStudentId: string) => {
    navigate(`/roommate-profile/${friendStudentId}`);
  };

  const handleAccept = async (friendshipId: string) => {
    await acceptRequest(friendshipId);
  };

  const handleMutualFriendsClick = (idA: string, idB: string) => {
    setMutualFriendsModal({ open: true, studentIdA: idA, studentIdB: idB });
  };

  const isRequestSent = (suggestionId: string) => {
    return sentRequests.some(
      fr => fr.receiver_id === suggestionId
    );
  };

  if (friendsLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Friend Requests Section */}
          {filteredRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Friend Requests</h3>
                <span className="text-sm text-muted-foreground">
                  ({filteredRequests.length})
                </span>
              </div>
              <div className="space-y-3">
                {filteredRequests.map(friendship => (
                  <FriendRequestCard
                    key={friendship.id}
                    friendship={friendship}
                    currentStudentId={studentId}
                    onAccept={handleAccept}
                    onReject={rejectRequest}
                    onMutualFriendsClick={handleMutualFriendsClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Your Friends Section */}
          {filteredFriends.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Your Friends</h3>
                <span className="text-sm text-muted-foreground">
                  ({filteredFriends.length})
                </span>
              </div>
              <div className="space-y-3">
                {filteredFriends.map(friendship => (
                  <FriendCard
                    key={friendship.id}
                    friendship={friendship}
                    currentStudentId={studentId}
                    onMessage={handleMessage}
                    onRemove={removeFriend}
                    onBlock={blockUser}
                    onViewProfile={handleViewProfile}
                    onMutualFriendsClick={handleMutualFriendsClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions Section */}
          {filteredSuggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">People You May Know</h3>
              </div>
              {suggestionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSuggestions.map(suggestion => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      currentStudentId={studentId}
                      onAddFriend={sendRequest}
                      onMutualFriendsClick={handleMutualFriendsClick}
                      isRequestSent={isRequestSent(suggestion.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredRequests.length === 0 &&
            filteredFriends.length === 0 &&
            filteredSuggestions.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Start connecting with other students!'}
                </p>
              </div>
            )}
        </div>
      </ScrollArea>

      <MutualFriendsModal
        open={mutualFriendsModal.open}
        onOpenChange={open =>
          setMutualFriendsModal(prev => ({ ...prev, open }))
        }
        studentIdA={mutualFriendsModal.studentIdA}
        studentIdB={mutualFriendsModal.studentIdB}
      />
    </>
  );
}
