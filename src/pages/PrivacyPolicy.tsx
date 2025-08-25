import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-body">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-purple-300 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to BubbleLink
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-4xl font-brand font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-purple-300 text-lg">
              Your privacy is important to us. Learn how we protect your data.
            </p>
            <p className="text-purple-400 text-sm mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 rounded-lg border border-purple-500/30 p-8 space-y-8">
          
          <section>
            <div className="flex items-center mb-4">
              <Eye className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-brand font-semibold text-white">Information We Collect</h2>
            </div>
            <div className="text-purple-200 space-y-4">
              <p>We collect information you provide directly to us, such as:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Bookmark URLs and titles you save</li>
                <li>Account information (email, password)</li>
                <li>Usage analytics to improve our service</li>
                <li>Payment information for premium subscriptions</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Database className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-brand font-semibold text-white">How We Use Your Information</h2>
            </div>
            <div className="text-purple-200 space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain our bookmark service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important service updates</li>
                <li>Improve our app based on usage patterns</li>
                <li>Provide customer support</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Lock className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-brand font-semibold text-white">Data Protection</h2>
            </div>
            <div className="text-purple-200 space-y-4">
              <p>We implement appropriate security measures to protect your personal information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All data is encrypted in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Secure payment processing through trusted providers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Local Storage</h2>
            <div className="text-purple-200 space-y-4">
              <p>
                BubbleLink stores your bookmarks locally in your browser's storage. This means:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your bookmarks are stored on your device</li>
                <li>We don't access your bookmarks unless you enable cloud sync</li>
                <li>You can export your data at any time</li>
                <li>Clearing browser data will remove your bookmarks</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Third-Party Services</h2>
            <div className="text-purple-200 space-y-4">
              <p>We may use third-party services for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payment processing (Stripe)</li>
                <li>Analytics (privacy-focused analytics only)</li>
                <li>Customer support</li>
                <li>Cloud hosting and storage</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Your Rights</h2>
            <div className="text-purple-200 space-y-4">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your bookmarks</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Contact Us</h2>
            <div className="text-purple-200">
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@bubblelink.app" className="text-purple-400 hover:text-purple-300">
                  privacy@bubblelink.app
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;