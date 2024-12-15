import GroupDetailsModal from '../components/GroupDetailsModal';

<GroupDetailsModal
  visible={groupDetailsModalVisible}
  group={selectedGroup}
  currentUser={currentUser}
  onClose={() => setGroupDetailsModalVisible(false)}
  onLeaveGroup={(groupId) => {
    setFriendGroups(groups => groups.filter(g => g.id !== groupId));
  }}
/>