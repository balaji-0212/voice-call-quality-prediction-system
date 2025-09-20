import plotly.graph_objects as go
import plotly.io as pio

# Data for model comparison
models = ["Random Forest", "Gradient Boosting", "Linear Regression"]
accuracies = [92.55, 92.82, 90.12]

# Create the bar chart
fig = go.Figure()

fig.add_trace(go.Bar(
    x=models,
    y=accuracies,
    text=[f"{acc:.1f}%" for acc in accuracies],
    textposition='outside',
    textfont=dict(size=14, color='black'),
    marker_color=['#1FB8CD', '#DB4545', '#2E8B57'],
    name='Model Accuracy'
))

# Update layout
fig.update_layout(
    title="ML Model Accuracy (%) Comparison",
    xaxis_title="ML Models",
    yaxis_title="Accuracy (%)",
    showlegend=False,
    yaxis=dict(range=[88, 95]),
    font=dict(size=12)
)

# Update traces for better appearance
fig.update_traces(cliponaxis=False)

# Update x-axis labels with better formatting and readability
fig.update_xaxes(
    tickvals=[0, 1, 2], 
    ticktext=["Random<br>Forest", "Gradient<br>Boosting", "Linear<br>Regression"],
    tickfont=dict(size=11)
)

# Update y-axis for better readability
fig.update_yaxes(tickfont=dict(size=11))

# Save as both PNG and SVG
fig.write_image("ml_model_comparison.png")
fig.write_image("ml_model_comparison.svg", format="svg")

fig.show()