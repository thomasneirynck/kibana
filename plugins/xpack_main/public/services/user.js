export default function UserProvider($injector, $q) {
  return {
    getCurrent() {
      if (!$injector.has('ShieldUser')) return $q.reject(new Error('Security services are not available'));
      const ShieldUser = $injector.get('ShieldUser');
      return ShieldUser.getCurrent();
    }
  };
};
