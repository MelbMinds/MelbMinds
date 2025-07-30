const { render, screen, fireEvent } = require('@testing-library/react');
const Dashboard = require('../Dashboard'); // Adjust the import based on your actual Dashboard component path
const api = require('../api'); // Adjust the import based on your actual API module path

jest.mock('../api');

test('should delete a group and call the correct API', async () => {
    render(<Dashboard />);

    const deleteButton = screen.getByText(/delete group/i);
    fireEvent.click(deleteButton);

    expect(api.deleteGroup).toHaveBeenCalledWith(expect.any(String)); // Replace with actual group ID if needed
    expect(await screen.findByText(/group deleted successfully/i)).toBeInTheDocument();
});